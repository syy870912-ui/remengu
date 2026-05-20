"""Stock API Routes"""

import logging
from datetime import date as date_cls
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import AdminUserDep
from models import Stock, Article
from schemas import StockItem, StockListResponse, StockDetailResponse, StockCreate, StockUpdate

logger = logging.getLogger("stock-analysis.api")

router = APIRouter(prefix="/api", tags=["stocks"])


@router.get("/stocks", response_model=StockListResponse)
async def list_stocks(
    sector: Optional[str] = Query(None),
    change_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    date: Optional[str] = Query(None, alias="date"),
    include_hidden: bool = Query(False, alias="include_hidden"),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Resolve snapshot date
        if date:
            snapshot = date_cls.fromisoformat(date)
        else:
            snapshot = date_cls.today()

        query = select(Stock).where(Stock.snapshot_date == snapshot)
        count_query = select(func.count(Stock.id)).where(Stock.snapshot_date == snapshot)

        if not include_hidden:
            query = query.where(Stock.hidden == False)
            count_query = count_query.where(Stock.hidden == False)

        # Filters
        if sector:
            query = query.where(Stock.sector == sector)
            count_query = count_query.where(Stock.sector == sector)

        if change_type:
            if change_type == "rise":
                query = query.where(Stock.change_percent > 0)
                count_query = count_query.where(Stock.change_percent > 0)
            elif change_type == "fall":
                query = query.where(Stock.change_percent < 0)
                count_query = count_query.where(Stock.change_percent < 0)
            elif change_type == "limit_up":
                query = query.where(Stock.change_percent >= 9.9)
                count_query = count_query.where(Stock.change_percent >= 9.9)
            elif change_type == "limit_down":
                query = query.where(Stock.change_percent <= -9.9)
                count_query = count_query.where(Stock.change_percent <= -9.9)

        if search:
            pattern = f"%{search}%"
            query = query.where(
                (Stock.code.like(pattern)) | (Stock.name.like(pattern))
            )
            count_query = count_query.where(
                (Stock.code.like(pattern)) | (Stock.name.like(pattern))
            )

        # Count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(Stock.rank.asc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        stocks = result.scalars().all()

        # Check articles for each stock
        items = []
        for s in stocks:
            art_query = select(Article.id).where(
                Article.stock_code == s.code,
                Article.snapshot_date == snapshot,
                Article.status == "published",
            )
            art_result = await db.execute(art_query)
            has_article = art_result.scalar() is not None

            vol = s.volume or 0
            if vol >= 10000:
                vol_str = f"{vol / 10000:.1f}万手"
            else:
                vol_str = f"{vol:.0f}手" if vol > 0 else "-"

            items.append(StockItem(
                rank=s.rank or 0,
                code=s.code,
                name=s.name,
                sector=s.sector,
                price=s.price,
                change=s.change,
                changePercent=s.change_percent,
                volume=vol_str,
                hasArticle=has_article,
            ))

        total_pages = (total + page_size - 1) // page_size

        return StockListResponse(
            items=items, total=total, page=page,
            pageSize=page_size, totalPages=total_pages,
        )

    except Exception as e:
        logger.error(f"Error listing stocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stocks/{code}", response_model=StockDetailResponse)
async def get_stock(code: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Stock).where(Stock.code == code).order_by(desc(Stock.snapshot_date)).limit(1)
        )
        stock = result.scalar_one_or_none()
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")

        # Check for latest article
        art_result = await db.execute(
            select(Article).where(
                Article.stock_code == code,
                Article.status == "published",
            ).order_by(desc(Article.snapshot_date)).limit(1)
        )
        article = art_result.scalar_one_or_none()

        vol = stock.volume or 0
        vol_str = f"{vol / 10000:.1f}万手" if vol >= 10000 else (f"{vol:.0f}手" if vol > 0 else "-")

        latest_article = None
        if article:
            latest_article = {
                "id": article.id,
                "stockCode": article.stock_code,
                "stockName": article.stock_name,
                "title": article.title,
                "rating": article.rating,
            }

        return StockDetailResponse(
            rank=stock.rank or 0,
            code=stock.code,
            name=stock.name,
            sector=stock.sector,
            price=stock.price,
            change=stock.change,
            changePercent=stock.change_percent,
            volume=vol_str,
            hasArticle=article is not None,
            latestArticle=latest_article,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stock {code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === Admin CRUD below ===

@router.post("/admin/stocks", response_model=dict, dependencies=[AdminUserDep])
async def create_stock(data: StockCreate, db: AsyncSession = Depends(get_db)):
    """手动添加股票"""
    try:
        # Check if already exists (even hidden)
        result = await db.execute(select(Stock).where(Stock.code == data.code))
        existing = result.scalar_one_or_none()
        if existing:
            if existing.hidden:
                existing.hidden = False
                existing.name = data.name
                existing.market = data.market or existing.market
                existing.sector = data.sector or existing.sector
                await db.commit()
                return {"success": True, "message": "股票已恢复（之前已隐藏）"}
            raise HTTPException(status_code=400, detail="股票代码已存在")

        new_stock = Stock(
            code=data.code,
            name=data.name,
            market=data.market or "SH",
            sector=data.sector,
            price=data.price,
            change=data.change,
            change_percent=data.change_percent,
            volume=data.volume,
            amount=data.amount,
            snapshot_date=date_cls.today(),
        )
        db.add(new_stock)
        await db.commit()
        await db.refresh(new_stock)
        return {"success": True, "message": "股票添加成功", "id": new_stock.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/stocks/{code}", response_model=dict, dependencies=[AdminUserDep])
async def update_stock(code: str, data: StockUpdate, db: AsyncSession = Depends(get_db)):
    """编辑股票信息"""
    try:
        result = await db.execute(select(Stock).where(Stock.code == code, Stock.hidden == False))
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="股票不存在")

        if data.name is not None:
            existing.name = data.name
        if data.market is not None:
            existing.market = data.market
        if data.sector is not None:
            existing.sector = data.sector
        if data.price is not None:
            existing.price = data.price
        if data.change is not None:
            existing.change = data.change
        if data.change_percent is not None:
            existing.change_percent = data.change_percent
        if data.volume is not None:
            existing.volume = data.volume
        if data.amount is not None:
            existing.amount = data.amount
        if data.rank is not None:
            existing.rank = data.rank
        if data.hidden is not None:
            existing.hidden = data.hidden

        await db.commit()
        return {"success": True, "message": "股票信息已更新"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating stock {code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/stocks/{code}", response_model=dict, dependencies=[AdminUserDep])
async def delete_stock(code: str, db: AsyncSession = Depends(get_db)):
    """软删除股票（设 hidden=True）"""
    try:
        result = await db.execute(select(Stock).where(Stock.code == code, Stock.hidden == False))
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="股票不存在")

        existing.hidden = True
        await db.commit()
        return {"success": True, "message": "股票已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stock {code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
