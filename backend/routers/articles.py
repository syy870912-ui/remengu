"""Article API Router"""

import json
import logging
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, or_, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, async_session
from dependencies import AdminUserDep
from models import Stock, Article, AnalysisTemplate
from schemas import (
    ArticleItem, ArticleListResponse, ArticleDetailResponse, SimpleResponse,
)

logger = logging.getLogger("stock-analysis.routers.articles")

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    search: Optional[str] = Query(None, description="搜索"),
    sector: Optional[str] = Query(None, description="板块筛选"),
    snapshot_date: Optional[str] = Query(None, description="日期 YYYY-MM-DD"),
    rating: Optional[str] = Query(None, description="评级: buy/hold/sell"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(Article).where(Article.status != "deleted")
        count_query = select(func.count(Article.id)).where(Article.status != "deleted")

        if snapshot_date:
            target_date = date.fromisoformat(snapshot_date)
            query = query.where(Article.snapshot_date == target_date)
            count_query = count_query.where(Article.snapshot_date == target_date)

        if sector:
            query = query.where(Article.sector == sector)
            count_query = count_query.where(Article.sector == sector)

        if rating:
            query = query.where(Article.rating == rating)
            count_query = count_query.where(Article.rating == rating)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    Article.stock_code.like(search_pattern),
                    Article.stock_name.like(search_pattern),
                    Article.title.like(search_pattern),
                )
            )
            count_query = count_query.where(
                or_(
                    Article.stock_code.like(search_pattern),
                    Article.stock_name.like(search_pattern),
                    Article.title.like(search_pattern),
                )
            )

        # Total count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get unique dates
        dates_query = (
            select(distinct(Article.snapshot_date))
            .where(Article.status != "deleted")
            .order_by(desc(Article.snapshot_date))
        )
        if snapshot_date:
            dates_query = dates_query.where(Article.snapshot_date == date.fromisoformat(snapshot_date))
        if sector:
            dates_query = dates_query.where(Article.sector == sector)
        dates_result = await db.execute(dates_query)
        dates = [str(d[0]) for d in dates_result.all()]

        # Pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        query = query.order_by(desc(Article.snapshot_date), desc(Article.id)).offset(offset).limit(page_size)

        result = await db.execute(query)
        articles = result.scalars().all()

        items = [
            ArticleItem(
                id=a.id,
                stockCode=a.stock_code,
                stockName=a.stock_name,
                sector=a.sector,
                title=a.title,
                createdAt=a.created_at,
                summary=a.summary,
                rating=a.rating,
            )
            for a in articles
        ]

        return ArticleListResponse(
            items=items,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
            dates=dates,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{stock_code}", response_model=ArticleDetailResponse)
async def get_article(stock_code: str, db: AsyncSession = Depends(get_db)):
    try:
        # Get latest article for this stock
        query = (
            select(Article)
            .where(Article.stock_code == stock_code, Article.status != "deleted")
            .order_by(desc(Article.snapshot_date))
            .limit(1)
        )
        result = await db.execute(query)
        article = result.scalar_one_or_none()

        if not article:
            raise HTTPException(status_code=404, detail=f"No article found for stock {stock_code}")

        # Parse content_json
        content = None
        if article.content_json:
            try:
                content = json.loads(article.content_json)
            except json.JSONDecodeError:
                content = {"raw": article.content_json}

        # Get matching stock data
        stock = None
        stock_query = (
            select(Stock)
            .where(Stock.code == stock_code, Stock.snapshot_date == article.snapshot_date)
            .limit(1)
        )
        stock_result = await db.execute(stock_query)
        stock_row = stock_result.scalar_one_or_none()
        if stock_row:
            stock = {
                "code": stock_row.code,
                "name": stock_row.name,
                "sector": stock_row.sector,
                "price": stock_row.price,
                "change": stock_row.change,
                "changePercent": stock_row.change_percent,
                "volume": stock_row.volume,
                "rank": stock_row.rank,
            }

        # Get related articles (same sector, same date, limit 5)
        related = []
        if article.sector and article.snapshot_date:
            related_query = (
                select(Article)
                .where(
                    Article.stock_code != stock_code,
                    Article.sector == article.sector,
                    Article.snapshot_date == article.snapshot_date,
                    Article.status != "deleted",
                )
                .order_by(desc(Article.id))
                .limit(5)
            )
            related_result = await db.execute(related_query)
            for r in related_result.scalars().all():
                related.append({
                    "id": r.id,
                    "stockCode": r.stock_code,
                    "stockName": r.stock_name,
                    "title": r.title,
                    "rating": r.rating,
                })

        return ArticleDetailResponse(
            id=article.id,
            stockCode=article.stock_code,
            stockName=article.stock_name,
            sector=article.sector,
            title=article.title,
            createdAt=article.created_at,
            summary=article.summary,
            rating=article.rating,
            stock=stock,
            content=content,
            relatedArticles=related,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{article_id}", response_model=SimpleResponse, dependencies=[AdminUserDep])
async def delete_article(article_id: int, db: AsyncSession = Depends(get_db)):
    try:
        query = select(Article).where(Article.id == article_id)
        result = await db.execute(query)
        article = result.scalar_one_or_none()

        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        article.status = "deleted"
        await db.commit()

        return SimpleResponse(success=True, message=f"Article {article_id} deleted")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stock_code}/regenerate", response_model=SimpleResponse, dependencies=[AdminUserDep])
async def regenerate_article(stock_code: str, db: AsyncSession = Depends(get_db)):
    try:
        # Find latest stock data for this code
        stock_query = (
            select(Stock)
            .where(Stock.code == stock_code)
            .order_by(desc(Stock.snapshot_date))
            .limit(1)
        )
        result = await db.execute(stock_query)
        stock = result.scalar_one_or_none()

        if not stock:
            raise HTTPException(status_code=404, detail=f"No stock data for {stock_code}")

        # Generate article
        from generators.article_generator import generate_article

        stock_dict = {
            "code": stock.code,
            "name": stock.name,
            "market": stock.market,
            "sector": stock.sector,
            "rank": stock.rank,
            "price": stock.price,
            "change": stock.change,
            "change_percent": stock.change_percent,
            "volume": stock.volume,
            "popularity_score": stock.popularity_score,
        }

        # Compute sector stats
        sector_stats_query = (
            select(Stock)
            .where(Stock.sector == stock.sector, Stock.snapshot_date == stock.snapshot_date)
        )
        sector_result = await db.execute(sector_stats_query)
        sector_stocks = sector_result.scalars().all()

        sector_stats = {
            "count": len(sector_stocks),
            "avg_change": sum(s.change_percent or 0 for s in sector_stocks) / max(len(sector_stocks), 1),
            "rising": sum(1 for s in sector_stocks if (s.change_percent or 0) > 0),
            "falling": sum(1 for s in sector_stocks if (s.change_percent or 0) < 0),
        }

        # Fetch enabled templates
        tpl_result = await db.execute(
            select(AnalysisTemplate.name).where(AnalysisTemplate.is_enabled == True)  # noqa: E712
        )
        enabled_templates = [row[0] for row in tpl_result.all()]

        generated = generate_article(stock_dict, str(stock.snapshot_date), sector_stats, enabled_templates)

        # Check if article exists for this stock+date
        article_query = select(Article).where(
            Article.stock_code == stock_code,
            Article.snapshot_date == stock.snapshot_date,
        )
        art_result = await db.execute(article_query)
        existing = art_result.scalar_one_or_none()

        if existing:
            existing.title = generated["title"]
            existing.summary = generated["summary"]
            existing.rating = generated["rating"]
            existing.content_json = generated["content_json"]
            existing.status = "published"
            existing.updated_at = datetime.now()
        else:
            new_article = Article(
                stock_code=stock_code,
                stock_name=stock.name,
                sector=stock.sector,
                snapshot_date=stock.snapshot_date,
                title=generated["title"],
                summary=generated["summary"],
                rating=generated["rating"],
                content_json=generated["content_json"],
                status="published",
            )
            db.add(new_article)

        await db.commit()

        return SimpleResponse(success=True, message=f"Article for {stock_code} regenerated")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
