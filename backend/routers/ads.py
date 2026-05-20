"""Ad Management API Routes"""

import logging
from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import AdminUserDep
from models import Ad
from schemas import AdItem, AdCreate, AdUpdate, AdListResponse

logger = logging.getLogger("stock-analysis.api.ads")
router = APIRouter(prefix="/api", tags=["ads"])


@router.get("/ads", response_model=List[dict])
async def get_ads(
    slot_position: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """前台获取活跃广告（按 slot_position 过滤，自动过滤有效期）"""
    try:
        query = select(Ad).where(Ad.is_active == True)
        today = date.today()
        query = query.where(
            (Ad.start_date == None) | (Ad.start_date <= today),
            (Ad.end_date == None) | (Ad.end_date >= today),
        )
        if slot_position:
            query = query.where(Ad.slot_position == slot_position)
        query = query.order_by(Ad.id.asc())
        result = await db.execute(query)
        ads = result.scalars().all()
        return [
            {
                "id": ad.id,
                "name": ad.name,
                "slot_position": ad.slot_position,
                "ad_type": ad.ad_type,
                "html_code": ad.html_code if ad.html_code else None,
                "image_url": ad.image_url if ad.image_url else None,
                "link_url": ad.link_url,
                "alt_text": ad.alt_text,
            }
            for ad in ads
        ]
    except Exception as e:
        logger.error(f"Error getting ads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/ads", response_model=AdListResponse, dependencies=[AdminUserDep])
async def list_admin_ads(
    slot_position: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """后台列表（分页，含停用）"""
    try:
        query = select(Ad)
        count_query = select(func.count(Ad.id))
        if slot_position:
            query = query.where(Ad.slot_position == slot_position)
            count_query = count_query.where(Ad.slot_position == slot_position)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size

        query = query.order_by(Ad.id.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        ads = result.scalars().all()

        items = [
            AdItem(
                id=ad.id,
                name=ad.name,
                slot_position=ad.slot_position,
                ad_type=ad.ad_type,
                html_code=ad.html_code,
                image_url=ad.image_url,
                link_url=ad.link_url,
                alt_text=ad.alt_text,
                is_active=ad.is_active,
                start_date=ad.start_date,
                end_date=ad.end_date,
                created_at=ad.created_at,
                updated_at=ad.updated_at,
            )
            for ad in ads
        ]
        return AdListResponse(
            items=items, total=total, page=page,
            page_size=page_size, total_pages=total_pages,
        )
    except Exception as e:
        logger.error(f"Error listing ads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/ads", response_model=dict, dependencies=[AdminUserDep])
async def create_ad(ad: AdCreate, db: AsyncSession = Depends(get_db)):
    """新建广告"""
    try:
        new_ad = Ad(
            name=ad.name,
            slot_position=ad.slot_position,
            ad_type=ad.ad_type,
            html_code=ad.html_code or "",
            image_url=ad.image_url or "",
            link_url=ad.link_url or "",
            alt_text=ad.alt_text or "",
            is_active=True if ad.is_active is None else ad.is_active,
            start_date=ad.start_date,
            end_date=ad.end_date,
        )
        db.add(new_ad)
        await db.commit()
        await db.refresh(new_ad)
        return {"success": True, "message": "广告创建成功", "id": new_ad.id}
    except Exception as e:
        logger.error(f"Error creating ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/ads/{ad_id}", response_model=dict, dependencies=[AdminUserDep])
async def update_ad(ad_id: int, ad: AdUpdate, db: AsyncSession = Depends(get_db)):
    """编辑广告"""
    try:
        result = await db.execute(select(Ad).where(Ad.id == ad_id))
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="广告不存在")
        if ad.name is not None:
            existing.name = ad.name
        if ad.slot_position is not None:
            existing.slot_position = ad.slot_position
        if ad.ad_type is not None:
            existing.ad_type = ad.ad_type
        if ad.html_code is not None:
            existing.html_code = ad.html_code
        if ad.image_url is not None:
            existing.image_url = ad.image_url
        if ad.link_url is not None:
            existing.link_url = ad.link_url
        if ad.alt_text is not None:
            existing.alt_text = ad._alt_text
        if ad.is_active is not None:
            existing.is_active = ad.is_active
        if ad.start_date is not None:
            existing.start_date = ad.start_date
        if ad.end_date is not None:
            existing.end_date = ad.end_date
        await db.commit()
        return {"success": True, "message": "广告更新成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/ads/{ad_id}", response_model=dict, dependencies=[AdminUserDep])
async def delete_ad(ad_id: int, db: AsyncSession = Depends(get_db)):
    """软删除（设 is_active=False）"""
    try:
        result = await db.execute(select(Ad).where(Ad.id == ad_id))
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="广告不存在")
        existing.is_active = False
        await db.commit()
        return {"success": True, "message": "广告已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/ads/{ad_id}/hard", response_model=dict, dependencies=[AdminUserDep])
async def hard_delete_ad(ad_id: int, db: AsyncSession = Depends(get_db)):
    """彻底删除（物理删除数据库记录）"""
    try:
        result = await db.execute(select(Ad).where(Ad.id == ad_id))
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="广告不存在")
        await db.delete(existing)
        await db.commit()
        return {"success": True, "message": "广告已彻底删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error hard deleting ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/ads/{ad_id}/toggle", response_model=dict, dependencies=[AdminUserDep])
async def toggle_ad(ad_id: int, db: AsyncSession = Depends(get_db)):
    """启用/停用切换"""
    try:
        result = await db.execute(select(Ad).where(Ad.id == ad_id))
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="广告不存在")
        existing.is_active = not existing.is_active
        await db.commit()
        return {
            "success": True,
            "message": "状态已切换",
            "is_active": existing.is_active,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))
