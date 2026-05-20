"""Authentication Router: login, get current user, change password."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import (
    verify_password, get_password_hash,
    create_access_token, decode_token,
)
from database import get_db, async_session
from models import AdminUser
from schemas import LoginRequest, LoginResponse, ChangePasswordRequest
from dependencies import get_current_user, AdminUserDep

logger = logging.getLogger("stock-analysis.routers.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )
    # update last_login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token({"sub": user.username})
    return LoginResponse(access_token=access_token, username=user.username)


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------
@router.get("/me")
async def get_me(current_user: AdminUser = AdminUserDep):
    return {
        "username": current_user.username,
        "is_active": current_user.is_active,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
    }


# ---------------------------------------------------------------------------
# POST /api/auth/change-password
# ---------------------------------------------------------------------------
@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: AdminUser = AdminUserDep,
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="旧密码不正确")
    current_user.password_hash = get_password_hash(req.new_password)
    await db.commit()
    return {"success": True, "message": "密码修改成功"}
