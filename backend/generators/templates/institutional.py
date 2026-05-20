"""Section 9: 机构持仓情况 (Institutional Holdings)"""

import random


def generate_institutional(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]

    total_ratio = round(rng.uniform(20, 65), 1)
    institution_count = rng.randint(15, 200)
    fund_ratio = round(rng.uniform(5, 25), 1)
    social_security_ratio = round(rng.uniform(0.5, 5), 1)
    foreign_ratio = round(rng.uniform(0, 10), 1)
    insurance_ratio = round(rng.uniform(0, 8), 1)
    qfii_ratio = round(rng.uniform(0, 5), 1)

    # Top institutional holders
    holders = []
    holder_names = [
        "华夏基金", "易方达基金", "南方基金", "嘉实基金", "广发基金",
        "博时基金", "富国基金", "中欧基金", "汇添富基金", "景顺长城",
        "全国社保基金", "香港中央结算公司", "中国证券金融",
    ]
    for h_name in rng.sample(holder_names, min(5, len(holder_names))):
        holders.append({
            "name": h_name,
            "ratio": f"{round(rng.uniform(0.5, 8), 2)}%",
            "change": rng.choice(["增持", "减持", "不变", "新进"]),
        })

    analysis = (
        f"{name}机构持仓比例为{total_ratio}%，共有{institution_count}家机构持有，"
        f"{'机构持仓比例较高，说明专业投资者对该股较为认可' if total_ratio > 40 else '机构持仓比例适中' if total_ratio > 20 else '机构持仓比例偏低，以个人投资者为主'}。"
        f"其中公募基金持仓{fund_ratio}%，"
        f"社保基金持仓{social_security_ratio}%，"
        f"外资持仓{foreign_ratio}%。"
        f"{'社保基金和外资的持股变化值得关注，通常被视为长线资金的风向标。' if social_security_ratio > 1 or foreign_ratio > 2 else ''}"
    )

    return {
        "total_ratio": f"{total_ratio}%",
        "institution_count": institution_count,
        "fund_ratio": f"{fund_ratio}%",
        "social_security_ratio": f"{social_security_ratio}%",
        "foreign_ratio": f"{foreign_ratio}%",
        "insurance_ratio": f"{insurance_ratio}%",
        "qfii_ratio": f"{qfii_ratio}%",
        "top_holders": holders,
        "analysis": analysis,
    }
