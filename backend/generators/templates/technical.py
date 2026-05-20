"""Section 7: 技术面分析 (Technical Analysis)"""

import random


def generate_technical(stock: dict, rng: random.Random) -> dict:
    price = stock.get("price", 10) or 10
    chg = stock.get("change_percent", 0) or 0
    is_rise = chg > 0

    # MA calculations (mock based on price)
    ma5 = round(price * rng.uniform(0.95, 1.05), 2)
    ma20 = round(price * rng.uniform(0.90, 1.10), 2)
    ma60 = round(price * rng.uniform(0.85, 1.15), 2)

    # MACD
    dif = round(rng.uniform(-2, 2), 3)
    dea = round(rng.uniform(-2, 2), 3)
    macd_bar = round((dif - dea) * 2, 3)
    macd_signal = "金叉" if dif > dea else "死叉"

    # KDJ
    k_val = round(rng.uniform(20, 80), 1)
    d_val = round(rng.uniform(20, 80), 1)
    j_val = round(3 * k_val - 2 * d_val, 1)

    # RSI
    rsi_6 = round(rng.uniform(20, 80), 1)
    rsi_12 = round(rng.uniform(25, 75), 1)
    rsi_14 = round(rng.uniform(30, 70), 1)

    # BOLL
    boll_upper = round(price * 1.05, 2)
    boll_middle = round(price * 1.00, 2)
    boll_lower = round(price * 0.95, 2)

    # Analysis
    ma_analysis = (
        f"{'MA5 > MA20 > MA60，均线多头排列，中期趋势向好' if ma5 > ma20 > ma60 else 'MA5 < MA20 < MA60，均线空头排列，中期趋势偏弱' if ma5 < ma20 < ma60 else '均线交织，短期方向不明确'}。"
        f"当前股价{'站上' if price > ma5 else '跌破'}MA5均线，"
        f"{'短期支撑有效' if price > ma5 else '短期支撑位失守'}。"
    )

    macd_analysis = (
        f"MACD指标DIF={dif}，DEA={dea}，柱状图{macd_bar}，"
        f"{'出现金叉信号，多头力量增强' if macd_signal == '金叉' else '出现死叉信号，空头力量增强'}。"
    )

    kdj_analysis = (
        f"KDJ指标K={k_val}，D={d_val}，J={j_val}，"
        f"{'指标在中轴附近，方向不明确' if 30 < k_val < 70 else '指标偏低，存在超卖信号' if k_val <= 30 else '指标偏高，存在超买信号' if k_val >= 70 else ''}。"
    )

    rsi_analysis = (
        f"RSI(14)={rsi_14}，"
        f"{'处于中性区间' if 30 < rsi_14 < 70 else '偏低，超卖区域' if rsi_14 <= 30 else '偏高，超买区域'}。"
    )

    overall = (
        f"综合技术面分析，{'多头占据优势，短期趋势偏强' if is_rise else '空头占据优势，短期趋势偏弱'}。"
        f"{'建议关注MA5支撑位' if is_rise else '建议关注上方MA5压力位'}"
        f"{'，量能配合是关键。' if is_rise else '，注意风险控制。'}"
    )

    return {
        "ma5": ma5,
        "ma20": ma20,
        "ma60": ma60,
        "macd": {"dif": dif, "dea": dea, "bar": macd_bar, "signal": macd_signal},
        "kdj": {"k": k_val, "d": d_val, "j": j_val},
        "rsi": {"rsi6": rsi_6, "rsi12": rsi_12, "rsi14": rsi_14},
        "boll": {"upper": boll_upper, "middle": boll_middle, "lower": boll_lower},
        "analysis": f"{ma_analysis}\n{macd_analysis}\n{kdj_analysis}\n{rsi_analysis}\n{overall}",
    }
