"""Task API Router"""

import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import AdminUserDep
from models import TaskLog
from schemas import TaskLogItem, TaskListResponse, TriggerResponse

logger = logging.getLogger("stock-analysis.routers.tasks")

router = APIRouter(prefix="/api/tasks", tags=["tasks"], dependencies=[AdminUserDep])


def _format_duration(seconds: int) -> str:
    if seconds is None:
        return None
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes}m {secs}s"


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    try:
        count_query = select(func.count(TaskLog.id))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = (
            select(TaskLog)
            .order_by(desc(TaskLog.id))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(query)
        tasks = result.scalars().all()

        items = [
            TaskLogItem(
                id=t.id,
                startTime=t.start_time,
                endTime=t.end_time,
                status=t.status,
                articleCount=t.article_count,
                errorCount=t.error_count,
                duration=_format_duration(t.duration_seconds),
            )
            for t in tasks
        ]

        return TaskListResponse(items=items, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger", response_model=TriggerResponse)
async def trigger_task(db: AsyncSession = Depends(get_db)):
    try:
        # Create a task log entry first
        now = datetime.now()
        task_log = TaskLog(start_time=now, status="running")
        db.add(task_log)
        await db.commit()
        await db.refresh(task_log)

        # Run daily task in background
        from services.task_runner import run_daily_task

        asyncio.create_task(run_daily_task(task_log.id))

        return TriggerResponse(
            success=True,
            message="Daily task triggered",
            taskId=task_log.id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
