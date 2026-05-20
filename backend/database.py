"""SQLite Database Setup with SQLAlchemy Async"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup, then seed default admin user."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default admin user if not exists
    async with async_session() as session:
        from sqlalchemy import select
        from models import AdminUser
        result = await session.execute(select(AdminUser).where(AdminUser.username == "admin"))
        if not result.scalar_one_or_none():
            from core.security import get_password_hash
            default_admin = AdminUser(
                username="admin",
                password_hash=get_password_hash("admin123"),
                is_active=True,
            )
            session.add(default_admin)
            await session.commit()
            print("[DB] Default admin user created: username=admin, password=admin123")

    print("[DB] Database initialized successfully.")
