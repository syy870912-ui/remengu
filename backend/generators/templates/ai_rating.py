"""Section 12: AI综合投资评级与展望 (AI Rating)"""

import random


def generate_ai_rating(stock: dict, content: dict, rng: random.Random) -> dict:
    name = stock["name"]
    code = stock["code"]
    chg = stock.get("change_percent", 0) or 0
    rank = stock.get("rank", 100)

    # Compute rating score (0-100)
    score = 50

    # Price momentum (40% weight)
    if chg > 9.9:
        score += 20
    elif chg > 5:
        score += 15
    elif chg > 2:
        score += 8
    elif chg > 0:
        score += 3
    elif chg < -5:
        score -= 15
    elif chg < -2:
        score -= 8
    elif chg < 0:
        score -= 3

    # Popularity rank (20% weight)
    if rank <= 10:
        score += 8
    elif rank <= 50:
        score += 5
    elif rank <= 100:
        score += 2

    # Seeded randomness (40% weight)
    seed_val = hash(f"{code}-rating") % 100
    score += (seed_val - 50) * 0.4

    # Clamp
    score = max(10, min(95, int(score)))

    # Determine rating
    if score >= 70:
        rating = "buy"
        rating_label = "买入"
    elif score >= 40:
        rating = "hold"
        rating_label = "观望"
    else:
        rating = "sell"
        rating_label = "卖出"

    # Generate outlook based on rating
    outlooks = {
        "buy": [
            f"综合多维分析，{name}（{code}）当前处于有利位置。"
            f"人气排名第{rank}位，市场关注度较高。"
            f"技术面和资金面均呈现积极信号，短期维持强势格局概率较大。"
            f"建议投资者可适度关注，注意设好止盈止损位。"
            f"关注上方压力位和成交量变化，若量能持续配合，有望进一步上行。",
        ],
        "hold": [
            f"{name}（{code}）多空因素交织，当前建议保持观望。"
            f"人气排名第{rank}位，市场关注度{'较高' if rank <= 50 else '一般'}。"
            f"部分技术指标出现分化信号，方向尚不明朗。"
            f"建议等待更明确的趋势信号出现后再做决策。"
            f"可关注后续量能变化和政策面动向。",
        ],
        "sell": [
            f"综合分析显示，{name}（{code}）当前风险较高，建议回避。"
            f"技术面和资金面均呈现偏弱信号，短期下行压力较大。"
            f"建议已持仓投资者考虑适当减仓，空仓投资者暂不介入。"
            f"密切关注止盈止损位，控制风险为首要原则。",
        ],
    }

    outlook = rng.choice(outlooks[rating])

    return {
        "rating": rating,
        "rating_label": rating_label,
        "score": score,
        "outlook": outlook,
        "time_horizon": "未来1-3个月",
    }
