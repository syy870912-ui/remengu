"""Section 4: 个股基本面解析 (Fundamentals)"""

import random


def generate_fundamentals(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    code = stock["code"]
    price = stock.get("price", 10) or 10
    sector = stock.get("sector", "市场")

    # Generate reasonable fundamental metrics based on sector and price
    pe = round(rng.uniform(10, 80), 1)
    pb = round(rng.uniform(1, 15), 2)
    market_cap = round(price * rng.uniform(5, 500) * 1e4)  # in 万元
    roe = round(rng.uniform(5, 35), 1)
    revenue_growth = round(rng.uniform(-10, 40), 1)
    net_profit_growth = round(rng.uniform(-15, 50), 1)
    debt_ratio = round(rng.uniform(20, 70), 1)
    current_ratio = round(rng.uniform(1, 5), 2)

    # Format market cap
    if market_cap >= 1e8:
        cap_str = f"{market_cap / 1e8:.2f}万亿"
    elif market_cap >= 1e4:
        cap_str = f"{market_cap / 1e4:.2f}亿"
    else:
        cap_str = f"{market_cap:.2f}万"

    pe_comment = "市盈率处于合理水平" if 15 < pe < 40 else ("市盈率偏低，估值具备安全边际" if pe <= 15 else "市盈率偏高，需关注盈利增长能否支撑")
    pb_comment = "市净率适中" if 1 < pb < 5 else ("破净或低市净率，价值投资视角值得关注" if pb <= 1 else "市净率偏高，资产溢价较多")

    analysis = (
        f"{name}（{code}）当前总市值{cap_str}，"
        f"动态市盈率{pe}倍（{pe_comment}），"
        f"市净率{pb}倍（{pb_comment}）。"
        f"净资产收益率（ROE）为{roe}%，"
        f"{'盈利能力较强' if roe > 15 else '盈利能力一般' if roe > 8 else '盈利能力偏弱'}。"
        f"最近一期营收同比增长{revenue_growth}%，"
        f"净利润同比增长{net_profit_growth}%。"
        f"资产负债率{debt_ratio}%，"
        f"流动比率{current_ratio}，"
        f"{'财务状况较为健康' if debt_ratio < 50 and current_ratio > 1.5 else '需关注财务风险'}。"
    )

    return {
        "pe_ttm": pe,
        "pb": pb,
        "market_cap": cap_str,
        "roe": f"{roe}%",
        "revenue_growth": f"{revenue_growth}%",
        "net_profit_growth": f"{net_profit_growth}%",
        "debt_ratio": f"{debt_ratio}%",
        "current_ratio": current_ratio,
        "analysis": analysis,
    }
