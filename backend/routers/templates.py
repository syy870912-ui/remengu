"""Analysis Template Management API Routes"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, async_session
from dependencies import AdminUserDep
from models import AnalysisTemplate
from schemas import TemplateItem, TemplateToggleResponse

logger = logging.getLogger("stock-analysis.api.templates")
router = APIRouter(prefix="/api/admin", tags=["templates"], dependencies=[AdminUserDep])


DEFAULT_TEMPLATES = [
    {"name": "abnormal_change", "display_name": "异动分析", "description": "分析股票异动原因"},
    {"name": "ai_rating", "display_name": "AI评级", "description": "AI 模型综合评级"},
    {"name": "announcements", "display_name": "公告解读", "description": "最新公告要点解读"},
    {"name": "business_analysis", "display_name": "业务分析", "description": "主营业务与竞争力"},
    {"name": "dragon_tiger", "display_name": "龙虎榜", "description": "龙虎榜席位动向"},
    {"name": "fund_flow", "display_name": "资金流向", "description": "主力资金净流入/流出"},
    {"name": "fundamentals", "display_name": "基本面", "description": "财务健康度与估值"},
    {"name": "institutional", "display_name": "机构动向", "description": "机构持仓变化"},
    {"name": "risk_warning", "display_name": "风险提示", "description": "潜在风险提示"},
    {"name": "sector_correlation", "display_name": "板块联动", "description": "板块联动效应分析"},
    {"name": "subsidiaries", "display_name": "关联公司", "description": "关联上市公司扫描"},
    {"name": "technical", "display_name": "技术分析", "description": "K线形态与均线信号"},
]


async def seed_templates(db: AsyncSession):
    result = await db.execute(select(func.count(AnalysisTemplate.id)))
    count = result.scalar() or 0
    if count == 0:
        for i, t in enumerate(DEFAULT_TEMPLATES):
            db.add(AnalysisTemplate(
                name=t["name"],
                display_name=t["display_name"],
                description=t["description"],
                is_enabled=True,
                sort_order=i,
            ))
        await db.commit()
        logger.info("Seeded %d analysis templates", len(DEFAULT_TEMPLATES))


@router.get("/templates", response_model=List[TemplateItem])
async def list_templates(db: AsyncSession = Depends(get_db)):
    """获取模板列表及启用状态"""
    try:
        await seed_templates(db)
        result = await db.execute(select(AnalysisTemplate).order_by(AnalysisTemplate.sort_order))
        items = result.scalars().all()
        return [
            TemplateItem(
                id=item.id,
                name=item.name,
                display_name=item.display_name,
                description=item.description or "",
                is_enabled=item.is_enabled,
                sort_order=item.sort_order,
            )
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/templates/{tpl_id}/toggle", response_model=TemplateToggleResponse)
async def toggle_template(tpl_id: int, db: AsyncSession = Depends(get_db)):
    """启用/禁用切换"""
    try:
        result = await db.execute(select(AnalysisTemplate).where(AnalysisTemplate.id == tpl_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Template not found")
        item.is_enabled = not item.is_enabled
        await db.commit()
        return {
            "success": True,
            "message": "状态已切换",
            "is_enabled": item.is_enabled,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/templates/reorder")
async def reorder_templates(order: List[int], db: AsyncSession = Depends(get_db)):
    """调整模板排序（传入 ID 列表，按顺序排列）"""
    try:
        for i, tpl_id in enumerate(order):
            result = await db.execute(select(AnalysisTemplate).where(AnalysisTemplate.id == tpl_id))
            item = result.scalar_one_or_none()
            if item:
                item.sort_order = i
        await db.commit()
        return {"success": True, "message": "排序已更新"}
    except Exception as e:
        logger.error(f"Error reordering templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))
