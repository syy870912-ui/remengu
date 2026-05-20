"""East Money Popularity Ranking Scraper"""

import json
import logging
import subprocess

from config import SCRAPE_TIMEOUT, MAX_STOCKS

logger = logging.getLogger("stock-analysis.scraper")


async def fetch_popularity_ranking(
    client=None,
    limit: int = MAX_STOCKS,
) -> list[dict]:
    """
    Fetch top N stocks from East Money API.
    Uses curl via subprocess to bypass proxy/network issues.

    Returns list of dicts with keys:
    - code: stock code (6 digits, e.g. "600519")
    - market: "SH" or "SZ" (derived from code prefix)
    - name: stock name
    - rank: popularity rank (1-based)
    - popularity_score: raw popularity score
    """
    # Calculate how many pages we need
    page_size = 100
    pages_needed = (limit + page_size - 1) // page_size

    all_stocks = []
    for page in range(1, pages_needed + 1):
        url = "https://push2.eastmoney.com/api/qt/clist/get"
        params = {
            "pn": page,
            "pz": page_size,
            "po": "1",
            "np": "1",
            "fltt": "2",
            "invt": "2",
            "fid": "f3",  # Sort by change percent
            "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",  # All markets
            "fields": "f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13",
        }

        # Build query string
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{url}?{query_string}"

        headers = [
            "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer: https://www.eastmoney.com/",
        ]

        try:
            result = subprocess.run(
                [
                    "curl", "-s", "--max-time", str(SCRAPE_TIMEOUT),
                    "-H", headers[0],
                    "-H", headers[1],
                    full_url,
                ],
                capture_output=True, text=True, timeout=SCRAPE_TIMEOUT + 5,
            )
            if result.returncode != 0:
                logger.warning(f"curl failed with returncode={result.returncode}, stderr={result.stderr[:200]}")
                break
            data = json.loads(result.stdout)
        except Exception as e:
            logger.warning(f"curl error: {e}")
            break

        if data.get("rc") != 0 and data.get("code") != 0:
            logger.warning(f"API returned rc={data.get('rc')}, code={data.get('code')}")
            break

        diff = data.get("data", {}).get("diff", [])
        if not diff:
            logger.warning(f"Empty diff for page {page}")
            break

        for item in diff:
            code = item.get("f12", "")
            if not code:
                continue
            market = "SH" if code.startswith("6") else "SZ"
            all_stocks.append({
                "code": code,
                "market": market,
                "name": item.get("f14", ""),
                "rank": len(all_stocks) + 1,
                "popularity_score": item.get("f62", 0),
                "price": item.get("f2"),
                "change": item.get("f4"),
                "change_percent": item.get("f3"),
            })

        if len(all_stocks) >= limit:
            break

    logger.info(f"Fetched {len(all_stocks)} stocks from API")
    return all_stocks[:limit]
