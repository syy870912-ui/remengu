"""Stock Analysis Backend Configuration"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = DATA_DIR / "logs"
DB_PATH = DATA_DIR / "stock_analysis.db"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Database (supports Railway PostgreSQL or local SQLite)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

# Scheduler
SCHEDULE_HOUR = int(os.getenv("SCHEDULE_HOUR", "15"))
SCHEDULE_MINUTE = int(os.getenv("SCHEDULE_MINUTE", "35"))
SCHEDULE_DAY_OF_WEEK = os.getenv("SCHEDULE_DAY_OF_WEEK", "mon-fri")

# API
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("PORT", os.getenv("API_PORT", "8000")))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",")

# Scraping
POPULARITY_URL = "https://emappdata.eastmoney.com/stockrank/getAllCurrentList"
QUOTES_URL = "https://push2.eastmoney.com/api/qt/ulist.np/get"
MAX_STOCKS = int(os.getenv("MAX_STOCKS", "200"))
SCRAPE_TIMEOUT = int(os.getenv("SCRAPE_TIMEOUT", "30"))
CONCURRENT_LIMIT = int(os.getenv("CONCURRENT_LIMIT", "10"))

# Article generation
ARTICLE_DELAY = float(os.getenv("ARTICLE_DELAY", "0.1"))  # seconds between article generations
