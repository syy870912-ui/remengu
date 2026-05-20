"""Section 8: 资金流向分析 (Fund Flow)"""

import random


def generate_fund_flow(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    chg = stock.get("change_percent", 0) or 0
    is_rise = chg > 0
    volume = stock.get("volume", 10000) or 10000

    # Generate fund flow data (in 万元)
    base = rng.uniform(1000, 20000)

    flows = [
        {
            "name": "超大单",
            "buyAmount": round(base * rng.uniform(0.3, 1.2) * (1.2 if is_rise else 0.8), 2),
            "sellAmount": round(base * rng.uniform(0.2, 0.8) * (0.8 if is_rise else 1.2), 2),
        },
        {
            "name": "大单",
            "buyAmount": round(base * rng.uniform(0.2, 0.8) * (1.1 if is_rise else 0.9), 2),
            "sellAmount": round(base * rng.uniform(0.2, 0.6) * (0.9 if is_rise else 1.1), 2),
        },
        {
            "name": "中单",
            "buyAmount": round(base * rng.uniform(0.1, 0.5), 2),
            "sellAmount": round(base * rng.uniform(0.1, 0.5), 2),
        },
        {
            "name": "小单",
            "buyAmount": round(base * rng.uniform(0.1, 0.4) * (0.8 if is_rise else 1.2), 2),
            "sellAmount": round(base * rng.uniform(0.1, 0.4) * (1.2 if is_rise else 0.8), 2),
        },
    ]

    for f in flows:
        f["netAmount"] = round(f["buyAmount"] - f["sellAmount"], 2)

    main_net = sum(f["netAmount"] for f in flows[:2])  # 大资金净流入
    total_net = sum(f["netAmount"] for f in flows)

    analysis = (
        f"{name}今日资金流向："
        f"超大单和大单合计净{'流入' if main_net > 0 else '流出'}{abs(main_net):.2f}万元，"
        f"全口径资金净{'流入' if total_net > 0 else '流出'}{abs(total_net):.2f}万元。"
        f"{'主力资金积极进场，大单净买入明显，短线资金面偏多。' if main_net > 0 else '主力资金有所撤退，大单净卖出，短线资金面偏空。'}"
        f"{'散户资金跟风买入意愿增强。' if is_rise else '散户资金离场迹象明显。'}"
        f"{'整体资金面配合股价上涨，短期有望延续。' if main_net > 0 and is_rise else '资金面与股价走势出现背离，需警惕回调风险。'}"
    )

    return {
        "flows": flows,
        "mainNet": round(main_net, 2),
        "totalNet": round(total_net, 2),
        "analysis": analysis,
    }
