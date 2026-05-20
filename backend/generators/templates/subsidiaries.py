"""Section 6: 控股及参股公司情况 (Subsidiaries)"""

import random


def generate_subsidiaries(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    sector = stock.get("sector", "其他")

    # Generate 3-6 subsidiaries
    company_types = [
        ("全资子公司", "100%"),
        ("控股子公司", f"{rng.randint(51, 99)}%"),
        ("参股公司", f"{rng.randint(10, 49)}%"),
    ]

    subsidiaries = []
    count = rng.randint(3, 6)
    used_names = set()

    for _ in range(count):
        ctype, ratio = rng.choice(company_types)
        # Generate subsidiary name
        prefix_options = [f"{name[:2]}科技", f"{name[:2]}投资", f"{name[:2]}发展", f"{name[:2]}商务", f"{name[:2]}服务"]
        suffix_options = ["有限公司", "股份有限公司", "有限责任公司", "（集团）有限公司"]
        while True:
            sub_name = rng.choice(prefix_options) + rng.choice(suffix_options)
            if sub_name not in used_names:
                used_names.add(sub_name)
                break

        subsidiaries.append({
            "name": sub_name,
            "ratio": ratio,
            "type": ctype,
            "registered_capital": f"{rng.randint(100, 50000)}万元",
        })

    analysis = (
        f"{name}旗下共有{count}家主要控股参股公司，"
        f"其中全资子公司{sum(1 for s in subsidiaries if s['type'] == '全资子公司')}家，"
        f"控股子公司{sum(1 for s in subsidiaries if s['type'] == '控股子公司')}家。"
        f"{'子公司整体经营状况良好，对公司业绩形成有效支撑。' if rng.random() > 0.3 else '部分子公司业绩承压，需关注后续整合效果。'}"
    )

    return {
        "companies": subsidiaries,
        "analysis": analysis,
    }
