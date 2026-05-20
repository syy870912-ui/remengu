"""Settings Management API Routes"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db, async_session
from dependencies import AdminUserDep
from models import Setting
from schemas import SettingItem, SettingUpdate, SettingsBatchUpdate

logger = logging.getLogger("stock-analysis.api.settings")
router = APIRouter(prefix="/api/admin", tags=["settings"], dependencies=[AdminUserDep])


# -- Seed default settings on first run --
DEFAULT_SETTINGS = [
    {"key": "site_name", "value": "股析AI", "value_type": "string", "description": "站点名称"},
    {"key": "site_description", "value": "AI驱动的股票深度分析平台", "value_type": "string", "description": "站点描述"},
    {"key": "page_size", "value": "20", "value_type": "int", "description": "每页显示数量"},
    {"key": "api_base_url", "value": "http://localhost:8000", "value_type": "string", "description": "后端 API 地址"},
    {"key": "fetch_limit", "value": "200", "value_type": "int", "description": "人气榜抓取数量"},
    {"key": "schedule_time", "value": "15:35", "value_type": "string", "description": "定时任务执行时间"},
    {"key": "auto_fetch_enabled", "value": "true", "value_type": "bool", "description": "是否启用自动采集"},
    {"key": "ai_model_name", "value": "deepseek-chat", "value_type": "string", "description": "使用的 AI 模型"},
]


async def seed_settings(db: AsyncSession):
    """Initialize default settings if table is empty."""
    result = await db.execute(select(func.count(Setting.id)))
    count = result.scalar() or 0
    if count == 0:
        for s in DEFAULT_SETTINGS:
            db.add(Setting(key=s["key"], value=s["value"], value_type=s["value_type"], description=s["description"]))
        await db.commit()
        logger.info("Seeded default settings")


@router.get("/settings", response_model=list[SettingItem])
async def list_settings(db: AsyncSession = Depends(get_db)):
    """获取所有设置"""
    await seed_settings(db)
    try:
        result = await db.execute(select(Setting).order_by(Setting.key))
        items = result.scalars().all()
        return [
            SettingItem(key=item.key, value=item.value, value_type=item.value_type, description=item.description)
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error listing settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings/{key}", response_model=SettingItem)
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    """获取单个设置"""
    try:
        await seed_settings(db)
        result = await db.execute(select(Setting).where(Setting.key == key))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Setting not found")
        return SettingItem(key=item.key, value=item.value, value_type=item.value_type, description=item.description)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting setting {key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings/{key}", response_model=dict)
async def update_setting(key: str, data: SettingUpdate, db: AsyncSession = Depends(get_db)):
    """更新单个设置"""
    try:
        await seed_settings(db)
        result = await db.execute(select(Setting).where(Setting.key == key))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Setting not found")
        item.value = data.value
        if data.value_type is not None:
            item.value_type = data.value_type
        item.updated_at = func.now()
        await db.commit()
        return {"success": True, "message": "Setting updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating setting {key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings/batch", response_model=dict)
async def batch_update_settings(data: SettingsBatchUpdate, db: AsyncSession = Depends(get_db)):
    """批量更新设置"""
    try:
        await seed_settings(db)
        for key, value in data.settings.items():
            result = await db.execute(select(Setting).where(Setting.key == key))
            item = result.scalar_one_or_none()
            if item:
                item.value = str(value)
                item.updated_at = func.now()
        await db.commit()
        return {"success": True, "message": "Settings batch updated"}
    except Exception as e:
        logger.error(f"Error batch updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))
