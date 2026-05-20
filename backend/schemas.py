"""Pydantic Request/Response Schemas"""

from pydantic import BaseModel, Field, field_validator, field_serializer
from typing import Optional, List
from datetime import datetime, date


# --- Ad Schemas ---

class AdBase(BaseModel):
    name: str
    slot_position: str  # banner / rectangle / leaderboard
    ad_type: str  # html / image
    html_code: Optional[str] = ""
    image_url: Optional[str] = ""
    link_url: Optional[str] = ""
    alt_text: Optional[str] = ""
    is_active: Optional[bool] = True
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AdCreate(AdBase):
    pass


class AdUpdate(BaseModel):
    name: Optional[str] = None
    slot_position: Optional[str] = None
    ad_type: Optional[str] = None
    html_code: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    alt_text: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AdItem(AdBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdListResponse(BaseModel):
    items: List[AdItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# --- Setting Schemas ---

class SettingItem(BaseModel):
    key: str
    value: str
    value_type: Optional[str] = "string"
    description: Optional[str] = ""

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    value: str
    value_type: Optional[str] = None


class SettingsBatchUpdate(BaseModel):
    settings: dict[str, str]  # key-value pairs


# --- AnalysisTemplate Schemas ---

class TemplateItem(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = ""
    is_enabled: bool = True
    sort_order: int = 0

    class Config:
        from_attributes = True


class TemplateToggleResponse(BaseModel):
    success: bool
    message: str
    is_enabled: bool


# --- SEO Setting Schemas ---

class SEOSettingItem(BaseModel):
    id: int
    page_type: str
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    meta_keywords: Optional[str] = ""
    updated_at: datetime

    class Config:
        from_attributes = True


class SEOSettingUpdate(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


# --- Stock Schemas ---

class StockCreate(BaseModel):
    code: str
    name: str
    market: str = "SH"  # SH / SZ
    sector: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[float] = None
    amount: Optional[float] = None


class StockUpdate(BaseModel):
    name: Optional[str] = None
    market: Optional[str] = None
    sector: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[float] = None
    amount: Optional[float] = None
    rank: Optional[int] = None
    hidden: Optional[bool] = None




class StockItem(BaseModel):
    rank: int
    code: str
    name: str
    sector: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    changePercent: Optional[float] = None
    volume: Optional[str] = None
    hasArticle: bool = False

    class Config:
        from_attributes = True


class StockListResponse(BaseModel):
    items: list[StockItem]
    total: int
    page: int
    pageSize: int
    totalPages: int


class StockDetailResponse(BaseModel):
    rank: int
    code: str
    name: str
    sector: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    changePercent: Optional[float] = None
    volume: Optional[str] = None
    hasArticle: bool = False
    latestArticle: Optional[dict] = None


# --- Article Schemas ---

class ArticleItem(BaseModel):
    id: int
    stockCode: str
    stockName: str
    sector: Optional[str] = None
    title: str
    createdAt: datetime
    summary: Optional[str] = None
    rating: str = "hold"

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    items: list[ArticleItem]
    total: int
    page: int
    pageSize: int
    totalPages: int
    dates: list[str] = []


class ArticleDetailResponse(BaseModel):
    id: int
    stockCode: str
    stockName: str
    sector: Optional[str] = None
    title: str
    createdAt: datetime
    summary: Optional[str] = None
    rating: str = "hold"
    stock: Optional[dict] = None
    content: Optional[dict] = None
    relatedArticles: list[dict] = []

    class Config:
        from_attributes = True
# --- Auth Schemas ---

class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, description="新密码（至少6位）")

class TaskLogItem(BaseModel):
    id: int
    startTime: str
    endTime: Optional[str] = None
    status: str
    articleCount: int = 0
    errorCount: int = 0
    duration: Optional[str] = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    items: list[TaskLogItem]
    total: int


class TriggerResponse(BaseModel):
    success: bool
    message: str
    taskId: int


# --- Sector Schemas ---

class SectorStatsItem(BaseModel):
    sector: str
    count: int
    avgChange: float


class DashboardStats(BaseModel):
    totalStocks: int = 0
    totalArticles: int = 0
    todayArticles: int = 0
    risingCount: int = 0
    fallingCount: int = 0
    limitUpCount: int = 0
    limitDownCount: int = 0
    sectorCount: int = 0
    lastUpdateTime: Optional[str] = None
    taskSuccessRate: Optional[str] = None
    ratingDistribution: dict = {}


class SimpleResponse(BaseModel):
    success: bool
    message: str
