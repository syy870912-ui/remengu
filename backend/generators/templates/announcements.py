"""Section 10: 近期重要公告及事件 (Announcements)"""

import random
from datetime import timedelta


def generate_announcements(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    code = stock["code"]

    # Build announcement templates outside f-strings
    _choices = lambda pool: rng.choice(pool)

    announcement_pool = [
        {"type": "业绩预告", "templates": [
            f"{name}发布{_choices(['半年度', '季度', '年度'])}业绩预告，预计净利润同比增长{rng.randint(10, 80)}%",
            f"{name}发布业绩修正公告，上调净利润预期至{rng.randint(5, 50)}亿元",
        ]},
        {"type": "重大合同", "templates": [
            f"{name}签订重大销售合同，合同金额约{rng.randint(1, 20)}亿元",
            f"{name}中标重大项目，中标金额{rng.randint(5000, 50000)}万元",
        ]},
        {"type": "股东增减持", "templates": [
            f"控股股东增持公司股份{rng.randint(100, 2000)}万股，占总股本{rng.uniform(0.1, 2):.1f}%",
            f"董监高减持公司股份{rng.randint(50, 500)}万股",
        ]},
        {"type": "研发进展", "templates": [
            f"{name}新产品获得{_choices(['发明专利', '注册证书', '生产批件'])}",
            f"公司研发项目取得阶段性成果，已进入{_choices(['临床试验', '小批量试产', '客户验证'])}阶段",
        ]},
        {"type": "分红派息", "templates": [
            f"{name}董事会通过利润分配预案，拟每10股派发现金红利{rng.randint(1, 20)}元",
            f"公司实施年度分红，股权登记日为近期",
        ]},
        {"type": "对外投资", "templates": [
            f"{name}拟对外投资设立{_choices(['全资', '控股'])}子公司，投资金额{rng.randint(1000, 50000)}万元",
            f"公司参与{_choices(['产业基金', '并购基金'])}投资，认缴金额{rng.randint(5000, 30000)}万元",
        ]},
        {"type": "回购股份", "templates": [
            f"{name}发布股份回购方案，拟回购金额{rng.randint(1, 30)}亿元",
            f"公司累计回购股份{rng.randint(100, 3000)}万股，占总股本{rng.uniform(0.1, 2):.1f}%",
        ]},
    ]

    items = []
    count = rng.randint(3, 5)
    selected = rng.sample(announcement_pool, min(count, len(announcement_pool)))

    base_date = "2026-05-19"
    for i, ann in enumerate(selected):
        template = rng.choice(ann["templates"])
        days_ago = rng.randint(1, 30)
        items.append({
            "date": f"2026-05-{max(1, 19 - days_ago):02d}",
            "title": template,
            "type": ann["type"],
        })

    items.sort(key=lambda x: x["date"], reverse=True)

    return {
        "items": items,
        "analysis": (
            f"近期{len(items)}条公告中，"
            f"{'利好公告占多数，整体信息面偏正面' if rng.random() > 0.4 else '公告信息中性偏多，需关注后续具体进展'}。"
            f"投资者应重点关注{items[0]['type']}类公告的后续进展。"
        ),
    }
