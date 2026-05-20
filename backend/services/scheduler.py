"""APScheduler Setup for Daily Tasks

Runs the daily task pipeline at 15:35 on weekdays (Mon-Fri).
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from config import SCHEDULE_HOUR, SCHEDULE_MINUTE

logger = logging.getLogger("stock-analysis.scheduler")

scheduler = BackgroundScheduler()


def _run_task():
    """Sync wrapper for the async task runner."""
    import asyncio
    from services.task_runner import run_daily_task

    try:
        asyncio.run(run_daily_task())
    except Exception as e:
        logger.error(f"Scheduler task error: {e}")


def start_scheduler():
    """Start the APScheduler with daily task."""
    scheduler.add_job(
        _run_task,
        CronTrigger(day_of_week="mon-fri", hour=SCHEDULE_HOUR, minute=SCHEDULE_MINUTE),
        id="daily_task",
        name="Daily Stock Analysis Task",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        f"Scheduler started - daily task at {SCHEDULE_HOUR:02d}:{SCHEDULE_MINUTE:02d} on weekdays"
    )


def stop_scheduler():
    """Stop the APScheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
