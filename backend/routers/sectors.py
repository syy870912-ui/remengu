"""Sector & Dashboard Stats API Router"""

import logging
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Stock, Article, TaskLog
from schemas import SectorStatsItem, DashboardStats

logger = logging.getLogger("stock-analysis.routers.sectors")

router = APIRouter(tags=["sectors"])


@router.get("/api/sectors", response_model=list[SectorStatsItem])
async def get_sector_stats(db: AsyncSession = Depends(get_db)):
    try:
        # Get latest snapshot date
        date_query = select(func.max(Stock.snapshot_date))
        date_result = await db.execute(date_query)
        latest_date = date_result.scalar()

        if not latest_date:
            return []

        # Group by sector and compute stats
        query = (
            select(
                Stock.sector,
                func.count(Stock.id).label("count"),
                func.avg(Stock.change_percent).label("avg_change"),
            )
            .where(Stock.snapshot_date == latest_date, Stock.sector.isnot(None))
            .group_by(Stock.sector)
            .order_by(desc(func.count(Stock.id)))
        )

        result = await db.execute(query)
        rows = result.all()

        return [
            SectorStatsItem(
                sector=row.sector,
                count=row.count,
                avgChange=round(row.avg_change, 2) if row.avg_change else 0.0,
            )
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    try:
        stats = DashboardStats()

        # Get latest snapshot date
        date_query = select(func.max(Stock.snapshot_date))
        date_result = await db.execute(date_query)
        latest_date = date_result.scalar()

        # Total stocks (latest date)
        if latest_date:
            total_stocks_q = select(func.count(Stock.id)).where(Stock.snapshot_date == latest_date)
            r = await db.execute(total_stocks_q)
            stats.totalStocks = r.scalar() or 0

            # Rising / falling / limit up / limit down
            rising_q = select(func.count(Stock.id)).where(
                Stock.snapshot_date == latest_date, Stock.change_percent > 0
            )
            falling_q = select(func.count(Stock.id)).where(
                Stock.snapshot_date == latest_date, Stock.change_percent < 0
            )
            limit_up_q = select(func.count(Stock.id)).where(
                Stock.snapshot_date == latest_date, Stock.change_percent >= 9.9
            )
            limit_down_q = select(func.count(Stock.id)).where(
                Stock.snapshot_date == latest_date, Stock.change_percent <= -9.9
            )
            sector_q = select(func.count(func.distinct(Stock.sector))).where(
                Stock.snapshot_date == latest_date, Stock.sector.isnot(None)
            )

            r1 = await db.execute(rising_q)
            stats.risingCount = r1.scalar() or 0
            r2 = await db.execute(falling_q)
            stats.fallingCount = r2.scalar() or 0
            r3 = await db.execute(limit_up_q)
            stats.limitUpCount = r3.scalar() or 0
            r4 = await db.execute(limit_down_q)
            stats.limitDownCount = r4.scalar() or 0
            r5 = await db.execute(sector_q)
            stats.sectorCount = r5.scalar() or 0

            stats.lastUpdateTime = str(latest_date)

        # Total articles
        total_articles_q = select(func.count(Article.id)).where(Article.status != "deleted")
        r = await db.execute(total_articles_q)
        stats.totalArticles = r.scalar() or 0

        # Today articles
        today = date.today()
        today_articles_q = select(func.count(Article.id)).where(
            Article.snapshot_date == today, Article.status != "deleted"
        )
        r = await db.execute(today_articles_q)
        stats.todayArticles = r.scalar() or 0

        # Rating distribution
        rating_q = select(Article.rating, func.count(Article.id)).where(
            Article.status != "deleted"
        ).group_by(Article.rating)
        r = await db.execute(rating_q)
        stats.ratingDistribution = {row[0]: row[1] for row in r.all()}

        # Task success rate
        total_tasks_q = select(func.count(TaskLog.id)).where(TaskLog.status.in_(["success", "failed"]))
        success_tasks_q = select(func.count(TaskLog.id)).where(TaskLog.status == "success")
        r_total = await db.execute(total_tasks_q)
        r_success = await db.execute(success_tasks_q)
        total_tasks = r_total.scalar() or 0
        success_tasks = r_success.scalar() or 0
        if total_tasks > 0:
            stats.taskSuccessRate = f"{success_tasks / total_tasks * 100:.1f}%"

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
