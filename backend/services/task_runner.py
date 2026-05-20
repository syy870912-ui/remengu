"""Daily Task Runner - Main Pipeline

Runs the full daily workflow:
1. Fetch popularity ranking
2. Fetch quotes
3. Classify sectors
4. Save stocks to DB
5. Generate articles for each stock
"""

import json
import logging
import time
from datetime import date, datetime

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from config import MAX_STOCKS
from database import async_session
from models import Stock, Article, TaskLog, AnalysisTemplate

logger = logging.getLogger("stock-analysis.task-runner")


async def run_daily_task(task_log_id: int = None):
    """Run the full daily task pipeline."""
    start_time = time.time()
    start_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    errors = []
    article_count = 0
    error_count = 0

    task_log = None
    async with async_session() as session:
        try:
            # Create or update task log
            now = datetime.now()
            if task_log_id:
                result = await session.execute(
                    select(TaskLog).where(TaskLog.id == task_log_id)
                )
                task_log = result.scalar_one_or_none()
            if task_log is None:
                task_log = TaskLog(start_time=now, status="running")
                session.add(task_log)
                await session.commit()
                await session.refresh(task_log)

            # Check if today is a trading day (skip weekends)
            today = date.today()
            weekday = today.weekday()
            if weekday >= 5:  # Saturday=5, Sunday=6
                task_log.status = "success"
                task_log.end_time = datetime.now()
                task_log.duration_seconds = int(time.time() - start_time)
                task_log.error_details = json.dumps(["Skipped - weekend"], ensure_ascii=False)
                await session.commit()
                logger.info("Skipping daily task - weekend")
                return

            logger.info(f"Starting daily task for {today}")

            # Step 1-3: Fetch data
            from scrapers.popularity import fetch_popularity_ranking
            from scrapers.quotes import fetch_quotes
            from scrapers.stock_info import batch_classify

            stocks = await fetch_popularity_ranking(limit=MAX_STOCKS)
            if not stocks:
                raise Exception("Failed to fetch popularity ranking - no stocks returned")

            stocks = await fetch_quotes(stocks)
            stocks = batch_classify(stocks)

            # Step 4: Save stocks to DB (upsert by code+date)
            for stock in stocks:
                stmt = sqlite_insert(Stock).values(
                    code=stock["code"],
                    name=stock.get("name", ""),
                    market=stock["market"],
                    sector=stock.get("sector"),
                    rank=stock.get("rank"),
                    price=stock.get("price"),
                    change=stock.get("change"),
                    change_percent=stock.get("change_percent"),
                    volume=stock.get("volume"),
                    amount=stock.get("amount"),
                    popularity_score=stock.get("popularity_score"),
                    snapshot_date=today,
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=["code", "snapshot_date"],
                    set_={
                        "name": stock.get("name", ""),
                        "market": stock["market"],
                        "sector": stock.get("sector"),
                        "rank": stock.get("rank"),
                        "price": stock.get("price"),
                        "change": stock.get("change"),
                        "change_percent": stock.get("change_percent"),
                        "volume": stock.get("volume"),
                        "amount": stock.get("amount"),
                        "popularity_score": stock.get("popularity_score"),
                    },
                )
                await session.execute(stmt)

            await session.commit()
            logger.info(f"Saved {len(stocks)} stocks to DB")

            # Step 5: Compute sector stats
            sector_stats = {}
            for stock in stocks:
                sec = stock.get("sector") or "未分类"
                if sec not in sector_stats:
                    sector_stats[sec] = {"stocks": [], "count": 0, "total_change": 0}
                sector_stats[sec]["stocks"].append(stock)
                sector_stats[sec]["count"] += 1
                sector_stats[sec]["total_change"] += stock.get("change_percent") or 0

            for sec in sector_stats:
                cnt = sector_stats[sec]["count"]
                if cnt > 0:
                    sector_stats[sec]["avg_change"] = sector_stats[sec]["total_change"] / cnt
                sector_stats[sec]["rising"] = sum(
                    1 for s in sector_stats[sec]["stocks"] if (s.get("change_percent") or 0) > 0
                )
                sector_stats[sec]["falling"] = sum(
                    1 for s in sector_stats[sec]["stocks"] if (s.get("change_percent") or 0) < 0
                )

            # Step 6: Generate articles
            from generators.article_generator import generate_article

            # Fetch enabled templates
            tpl_result = await session.execute(
                select(AnalysisTemplate.name).where(AnalysisTemplate.is_enabled == True)  # noqa: E712
            )
            enabled_templates = [row[0] for row in tpl_result.all()]

            for stock in stocks:
                try:
                    # Check if article already exists
                    existing_q = select(Article).where(
                        Article.stock_code == stock["code"],
                        Article.snapshot_date == today,
                    )
                    existing_result = await session.execute(existing_q)
                    if existing_result.scalar_one_or_none():
                        continue

                    generated = generate_article(stock, str(today), sector_stats, enabled_templates)

                    article = Article(
                        stock_code=stock["code"],
                        stock_name=stock.get("name", ""),
                        sector=stock.get("sector"),
                        snapshot_date=today,
                        title=generated["title"],
                        summary=generated["summary"],
                        rating=generated["rating"],
                        content_json=generated["content_json"],
                        status="published",
                    )
                    session.add(article)
                    article_count += 1

                    # Commit periodically
                    if article_count % 10 == 0:
                        await session.commit()

                except Exception as e:
                    error_count += 1
                    err_msg = f"{stock['code']} {stock.get('name', '')}: {str(e)}"
                    errors.append(err_msg)
                    logger.error(f"Error generating article: {err_msg}")

            # Final commit
            await session.commit()

            # Update task log
            task_log.status = "success"
            task_log.article_count = article_count
            task_log.error_count = error_count
            if errors:
                task_log.error_details = json.dumps(errors, ensure_ascii=False)

            logger.info(
                f"Daily task completed: {article_count} articles, {error_count} errors"
            )

        except Exception as e:
            logger.error(f"Daily task failed: {e}")
            if task_log is not None:
                task_log.status = "failed"
                errors.append(str(e))
                task_log.error_details = json.dumps(errors, ensure_ascii=False)
                task_log.article_count = article_count
                task_log.error_count = error_count

        finally:
            if task_log is not None:
                task_log.end_time = datetime.now()
                task_log.duration_seconds = int(time.time() - start_time)
                await session.commit()
