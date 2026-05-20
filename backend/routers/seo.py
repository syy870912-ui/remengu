"""SEO Management API Routes"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, async_session
from dependencies import AdminUserDep
from models import SEOSetting, AdminUser
from schemas import SEOSettingItem, SEOSettingUpdate

logger = logging.getLogger("stock-analysis.api.seo")
router = APIRouter(prefix="/api", tags=["seo"])


DEFAULT_SEO = [
    {"page_type": "home", "meta_title": "股析AI - 股票深度分析平台", "meta_description": "AI驱动的股票深度分析平台，每日自动生成200只热门股票的专业分析报告。", "meta_keywords": "股票分析,AI分析,股析AI,东方财富,人气榜"},
    {"page_type": "sector_list", "meta_title": "板块行情 - 股析AI", "meta_description": "查看各板块实时行情与AI分析报告。", "meta_keywords": "板块分析,行业分析,股票板块"},
    {"page_type": "sector_detail", "meta_title": "", "meta_description": "", "meta_keywords": ""},
    {"page_type": "article_list", "meta_title": "分析报告列表 - 股析AI", "meta_description": "浏览所有AI生成的股票深度分析报告。", "meta_keywords": "股票报告,AI报告,股票分析"},
    {"page_type": "article_detail", "meta_title": "", "meta_description": "", "meta_keywords": ""},
]


async def seed_seo(db: AsyncSession):
    result = await db.execute(select(func.count(SEOSetting.id)))
    count = result.scalar() or 0
    if count == 0:
        for s in DEFAULT_SEO:
            db.add(SEOSetting(
                page_type=s["page_type"],
                meta_title=s["meta_title"],
                meta_description=s["meta_description"],
                meta_keywords=s["meta_keywords"],
            ))
        await db.commit()
        logger.info("Seeded default SEO settings")


@router.get("/admin/seo", response_model=List[SEOSettingItem], dependencies=[AdminUserDep])
async def list_seo(db: AsyncSession = Depends(get_db)):
    try:
        await seed_seo(db)
        result = await db.execute(select(SEOSetting).order_by(SEOSetting.id))
        items = result.scalars().all()
        return [
            SEOSettingItem(
                id=item.id,
                page_type=item.page_type,
                meta_title=item.meta_title or "",
                meta_description=item.meta_description or "",
                meta_keywords=item.meta_keywords or "",
                updated_at=item.updated_at,
            )
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error listing SEO: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/seo/{page_type}", response_model=dict, dependencies=[AdminUserDep])
async def update_seo(page_type: str, data: SEOSettingUpdate, db: AsyncSession = Depends(get_db)):
    try:
        await seed_seo(db)
        result = await db.execute(select(SEOSetting).where(SEOSetting.page_type == page_type))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="SEO setting not found")
        if data.meta_title is not None:
            item.meta_title = data.meta_title
        if data.meta_description is not None:
            item.meta_description = data.meta_description
        if data.meta_keywords is not None:
            item.meta_keywords = data.meta_keywords
        item.updated_at = datetime.now()
        await db.commit()
        return {"success": True, "message": "SEO setting updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating SEO: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seo/meta")
async def get_meta(path: str, db: AsyncSession = Depends(get_db)):
    """前台获取当前路径对应的 meta 信息"""
    try:
        await seed_seo(db)
        # Simple path matching
        page_type = "home"
        if path.startswith("/sectors"):
            page_type = "sector_list"
        elif path.startswith("/article/"):
            page_type = "article_detail"
        elif path == "/articles":
            page_type = "article_list"

        result = await db.execute(select(SEOSetting).where(SEOSetting.page_type == page_type))
        item = result.scalar_one_or_none()
        if not item:
            return {"meta_title": "", "meta_description": "", "meta_keywords": ""}
        return {
            "meta_title": item.meta_title or "",
            "meta_description": item.meta_description or "",
            "meta_keywords": item.meta_keywords or "",
        }
    except Exception as e:
        logger.error(f"Error getting meta: {e}")
        return {"meta_title": "", "meta_description": "", "meta_keywords": ""}


@router.get("/seo/sitemap")
async def get_sitemap(db: AsyncSession = Depends(get_db)):
    """生成 sitemap.xml"""
    from fastapi.responses import Response
    import xml.etree.ElementTree as ET

    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

    # Home
    url = ET.SubElement(urlset, "url")
    ET.SubElement(url, "loc").text = "https://yourdomain.com/"
    ET.SubElement(url, "changefreq").text = "daily"
    ET.SubElement(url, "priority").text = "1.0"

    # Sectors
    url = ET.SubElement(urlset, "url")
    ET.SubElement(url, "loc").text = "https://yourdomain.com/sectors"
    ET.SubElement(url, "changefreq").text = "daily"
    ET.SubElement(url, "priority").text = "0.8"

    # Articles (get from DB)
    try:
        result = await db.execute(select(SEOSetting).where(SEOSetting.page_type == "article_list"))
        # Add some article URLs...
    except:
        pass

    xml_str = ET.tostring(urlset, encoding="unicode")
    xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str

    return Response(content=xml_str, media_type="application/xml")
