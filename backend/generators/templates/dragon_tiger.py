"""Section 1: 龙虎榜信息 (Dragon Tiger List)"""

import random


def generate_dragon_tiger(stock: dict, rng: random.Random) -> dict:
    chg = stock.get("change_percent", 0) or 0
    visible = abs(chg) >= 5

    if not visible:
        return {"visible": False, "data": None, "analysis": ""}

    name = stock["name"]
    is_rise = chg > 0
    direction = "买入" if is_rise else "卖出"

    # Generate mock institutional seats
    seats_buy = []
    seats_sell = []

    buyer_seats = [
        "中信证券上海分公司", "华泰证券深圳益田路", "东方财富证券拉萨团结路",
        "国泰君安上海江苏路", "招商证券深圳南山", "中泰证券上海建国中路",
        "国信证券深圳泰然九路", "银河证券绍兴证券营业部",
    ]
    seller_seats = [
        "华泰证券南京中山北路", "中信证券北京建国门", "国联证券无锡民生",
        "东方财富证券拉萨东环路", "海通证券上海广州路", "申万宏源上海闵行",
    ]

    buy_count = rng.randint(3, 5)
    sell_count = rng.randint(2, 4)

    for i in range(buy_count):
        amount = round(rng.uniform(500, 5000), 2)
        seats_buy.append({
            "seat": rng.choice(buyer_seats),
            "buyAmount": amount,
            "sellAmount": round(rng.uniform(0, amount * 0.3), 2),
        })

    for i in range(sell_count):
        amount = round(rng.uniform(300, 4000), 2)
        seats_sell.append({
            "seat": rng.choice(seller_seats),
            "buyAmount": round(rng.uniform(0, amount * 0.3), 2),
            "sellAmount": amount,
        })

    total_buy = sum(s["buyAmount"] for s in seats_buy)
    total_sell = sum(s["sellAmount"] for s in seats_sell)
    net = round(total_buy - total_sell, 2)

    analysis = (
        f"{name}今日{'涨停' if chg >= 9.9 else '大涨'}上榜龙虎榜，"
        f"买方前{buy_count}席位合计买入{total_buy:.2f}万元，"
        f"卖方前{sell_count}席位合计卖出{total_sell:.2f}万元，"
        f"净{'买入' if net > 0 else '卖出'}{abs(net):.2f}万元。"
        f"{'资金整体呈现净流入态势，主力资金参与意愿较强。' if net > 0 else '虽然上榜，但资金呈现净流出，需关注后续资金动向。'}"
    )

    return {
        "visible": True,
        "data": {"buyers": seats_buy, "sellers": seats_sell},
        "analysis": analysis,
    }
