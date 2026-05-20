"""FastAPI Application Entry Point (with auth router inline for debugging)"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Add backend dir to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, LOGS_DIR
from database import init_db
from routers import stocks, articles, tasks, sectors, ads, settings, templates, seo
from services.scheduler import start_scheduler, stop_scheduler

# --- Auth router (inline import to avoid __init__.py issues) ---
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.security import verify_password, get_password_hash, create_access_token, decode_token
from database import get_db
from models import AdminUser
from schemas import LoginRequest, LoginResponse, ChangePasswordRequest

logger = logging.getLogger("stock-analysis")

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 内容无效",
            headers={"WWW-Authenticate": "Bearer"},
        )
    result = await db.execute(select(AdminUser).where(AdminUser.username == username))
    from sqlalchemy.ext.asyncio import AsyncSession as _  # noqa: F401
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

AdminUserDep = Depends(get_current_user)

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

@auth_router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已被禁用")
    user.last_login = __import__('datetime').datetime.now(__import__('datetime').timezone.utc)
    await db.commit()
    access_token = create_access_token({"sub": user.username})
    return LoginResponse(access_token=access_token, username=user.username)

@auth_router.get("/me")
async def get_me(current_user: AdminUser = AdminUserDep):
    return {"username": current_user.username, "is_active": current_user.is_active, "last_login": current_user.last_login.isoformat() if current_user.last_login else None}

@auth_router.post("/change-password")
async def change_password(req: ChangePasswordRequest, current_user: AdminUser = AdminUserDep, db: AsyncSession = Depends(get_db)):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="旧密码不正确")
    current_user.password_hash = get_password_hash(req.new_password)
    await db.commit()
    return {"success": True, "message": "密码修改成功"}

# Logging setup
LOGS_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOGS_DIR / "app.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("stock-analysis")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Stock Analysis Backend...")
    await init_db()
    start_scheduler()
    logger.info("Backend ready.")
    yield
    stop_scheduler()
    logger.info("Shutting down...")

app = FastAPI(
    title="股析AI API",
    description="股票分析报告自动生成系统后端API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(stocks.router)
app.include_router(articles.router)
app.include_router(tasks.router)
app.include_router(sectors.router)
app.include_router(ads.router)
app.include_router(settings.router)
app.include_router(templates.router)
app.include_router(seo.router)
app.include_router(auth_router)  # 认证路由（内联）

# Mount static files (for ad images)
import os
from fastapi.staticfiles import StaticFiles
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(STATIC_DIR, "ads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- Serve frontend static files (Railway deployment) ---
import os as _os
from fastapi.staticfiles import StaticFiles as _SF
from fastapi.responses import FileResponse as _FR

_FRONTEND_DIST = _os.path.join(_os.path.dirname(__file__), "..", "dist")
if _os.path.isdir(_FRONTEND_DIST):
    @app.get("/{fullpath:path}")
    async def _serve_spa(fullpath: str):
        _file = _os.path.join(_FRONTEND_DIST, fullpath)
        if _os.path.isfile(_file) and not fullpath.endswith(".html"):
            return _FR(_file)
        _index = _os.path.join(_FRONTEND_DIST, "index.html")
        if _os.path.isfile(_index):
            return _FR(_index)
        return {"detail": "Frontend not built. Run: npm run build"}, 404

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "股析AI Backend is running"}

@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
