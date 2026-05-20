"""SQLAlchemy ORM Models"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, Boolean, UniqueConstraint
from database import Base


class Ad(Base):
    __tablename__ = "ads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slot_position = Column(String(20), nullable=False, index=True)  # banner / rectangle / leaderboard
    ad_type = Column(String(10), nullable=False)  # html / image
    html_code = Column(Text, default="")
    image_url = Column(String(500), default="")
    link_url = Column(String(500), default="")
    alt_text = Column(String(200), default="")
    is_active = Column(Boolean, default=True, index=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    market = Column(String(5), nullable=False)  # SH or SZ
    sector = Column(String(20))
    rank = Column(Integer)
    price = Column(Float)
    change = Column(Float)
    change_percent = Column(Float)
    volume = Column(Float)
    amount = Column(Float)
    popularity_score = Column(Integer)
    hidden = Column(Boolean, default=False)  # 软删除标记
    snapshot_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        UniqueConstraint("code", "snapshot_date", name="uq_stock_date"),
    )


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stock_code = Column(String(10), nullable=False, index=True)
    stock_name = Column(String(50), nullable=False)
    sector = Column(String(20))
    snapshot_date = Column(Date, nullable=False, index=True)
    title = Column(Text, nullable=False)
    summary = Column(Text)
    rating = Column(String(10), nullable=False, default="hold")  # buy/hold/sell
    status = Column(String(10), default="published")  # draft/published/deleted
    content_json = Column(Text, nullable=False)  # JSON with 12 sections
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        UniqueConstraint("stock_code", "snapshot_date", name="uq_article_stock_date"),
    )


class TaskLog(Base):
    __tablename__ = "task_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    start_time = Column(String(30), nullable=False)
    end_time = Column(String(30))
    status = Column(String(10), nullable=False, default="running")  # running/success/failed
    article_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    error_details = Column(Text)  # JSON array of error messages
    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(Text, default="")
    value_type = Column(String(20), default="string")  # string / int / float / bool / json
    description = Column(String(500), default="")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class AnalysisTemplate(Base):
    __tablename__ = "analysis_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)  # 模板文件名（不含 .py）
    display_name = Column(String(100), nullable=False)
    description = Column(String(500), default="")
    is_enabled = Column(Boolean, default=True, index=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class SEOSetting(Base):
    __tablename__ = "seo_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    page_type = Column(String(50), nullable=False, unique=True, index=True)  # home / sector_list / sector_detail / article_list / article_detail
    meta_title = Column(String(200), default="")
    meta_description = Column(Text, default="")
    meta_keywords = Column(String(500), default="")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)
