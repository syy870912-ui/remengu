"""Real-time Quote Fetcher

Fetches latest price, change, volume for stocks from East Money push API.
API: GET https://push2.eastmoney.com/api/qt/ulist.np/get
"""

import json
import logging
import subprocess

from config import QUOTES_URL, SCRAPE_TIMEOUT

logger = logging.getLogger("stock-analysis.quotes")


def _safe_float(value) -> float | None:
    """Convert value to float, return None if invalid."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


async def fetch_quotes(
    stocks: list[dict],
    client=None,  # Kept for backwards compatibility, not used
    timeout: int = SCRAPE_TIMEOUT,
) -> list[dict]:
    """
    Fetch real-time quotes for a list of stocks.

    Args:
        client: Unused (kept for backwards compatibility)
        stocks: list of dicts with 'code' and 'market' keys
        timeout: request timeout in seconds

    Returns:
        list of dicts with quote data merged in:
        - price, change, change_percent, volume, amount
    """
    if not stocks:
        return []

    # Build secids string: "1.600519,0.000001,..."
    secids = ",".join(
        f"{'1' if s['market'] == 'SH' else '0'}.{s['code']}"
        for s in stocks
    )

    params = {
        "ut": "fa5fd1943c7b386f172d6893dbfba10b",
        "fltt": "2",
        "fields": "f2,f3,f4,f5,f6,f7,f12,f14",
        "secids": secids,
    }

    # Use curl via subprocess to bypass any proxy/network issues
    try:
        result = subprocess.run(
            [
                "curl", "-s",
                "-G",  # GET with params
                "--max-time", str(timeout),
                "-H", "User-Agent: Mozilla/5.0",
                "-H", "Referer: https://quote.eastmoney.com/",
                "--data-urlencode", f"ut={params['ut']}",
                "--data-urlencode", f"fltt={params['fltt']}",
                "--data-urlencode", f"fields={params['fields']}",
                "--data-urlencode", f"secids={secids}",
                QUOTES_URL,
            ],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        if result.returncode != 0:
            logger.warning(f"curl failed with returncode={result.returncode}, stderr={result.stderr[:200]}")
            return stocks

        data = json.loads(result.stdout)

        if data.get("data") is None:
            logger.warning("No data in quotes response")
            return stocks

        # Build a lookup by code
        quote_map = {}
        for item in data["data"].get("diff", []):
            code = str(item.get("f12", ""))
            if not code:
                continue
            quote_map[code] = {
                "price": _safe_float(item.get("f2")),
                "change": _safe_float(item.get("f4")),
                "change_percent": _safe_float(item.get("f3")),
                "volume": _safe_float(item.get("f5")),
                "amount": _safe_float(item.get("f6")),
                "name": item.get("f14", ""),
            }

        # Merge quote data into stocks
        for s in stocks:
            quote = quote_map.get(s["code"], {})
            s.update(quote)
            # Fill in name if missing from popularity API
            if not s.get("name") and quote.get("name"):
                s["name"] = quote["name"]

        logger.info(f"Fetched quotes for {len(quote_map)} stocks")
        return stocks

    except Exception as e:
        logger.error(f"Unexpected error fetching quotes: {e}")
        return stocks
