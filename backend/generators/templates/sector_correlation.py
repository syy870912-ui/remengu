"""Section 3: 板块联动效应分析 (Sector Correlation)"""

import random


def generate_sector_correlation(stock: dict, rng: random.Random, sector_stats: dict = None) -> dict:
    sector = stock.get("sector", "未分类")
    name = stock["name"]
    chg = stock.get("change_percent", 0) or 0

    # If real sector stats provided, use them
    if sector_stats and sector in sector_stats:
        avg_change = sector_stats[sector].get("avgChange", 0)
        count = sector_stats[sector].get("count", 0)
    else:
        avg_change = round(chg + rng.uniform(-2, 2), 2)
        count = rng.randint(8, 25)

    # Find sector rank
    is_rise = chg > 0
    sector_rank = rng.randint(1, 12) if is_rise else rng.randint(5, 12)
    correlation = "强" if abs(chg - avg_change) < 2 else ("较强" if abs(chg - avg_change) < 4 else "一般")

    # Generate mock sector stock list
    sector_stocks = []
    stock_names_pool = {
        "科技": ["中科曙光", "浪潮信息", "紫光股份", "科大讯飞", "中科创达"],
        "消费": ["五粮液", "泸州老窖", "洋河股份", "伊利股份", "海天味业"],
        "医药": ["恒瑞医药", "药明康德", "迈瑞医疗", "长春高新", "云南白药"],
        "金融": ["招商银行", "中国平安", "宁波银行", "东方财富", "中信证券"],
        "能源": ["中国石油", "中国神华", "国电电力", "华能国际", "长江电力"],
        "新能源": ["宁德时代", "比亚迪", "隆基绿能", "阳光电源", "通威股份"],
        "军工": ["中航沈飞", "航发动力", "中航光电", "中航西飞", "振华科技"],
        "地产": ["保利发展", "万科A", "招商蛇口", "金地集团", "华发股份"],
        "农业": ["牧原股份", "温氏股份", "海大集团", "新希望", "圣农发展"],
        "传媒": ["完美世界", "三七互娱", "芒果超媒", "光线传媒", "分众传媒"],
        "通信": ["中国移动", "中国联通", "中兴通讯", "烽火通信", "紫光国微"],
        "有色金属": ["紫金矿业", "洛阳钼业", "北方稀土", "中国铝业", "江西铜业"],
    }
    pool = stock_names_pool.get(sector, ["A股公司A", "A股公司B", "A股公司C", "A股公司D"])
    for sn in rng.sample(pool, min(4, len(pool))):
        sector_stocks.append({
            "name": sn,
            "change": round(rng.uniform(-8, 8), 2),
        })

    analysis = (
        f"今日{sector}板块整体{'走强' if avg_change > 0 else '走弱'}，"
        f"板块平均涨跌幅为{avg_change:+.2f}%，在所有板块中排名第{sector_rank}位。"
        f"{name}与板块联动效应为{correlation}，"
        f"{'领涨板块，带动效应明显' if chg > avg_change > 0 else '跟涨板块，联动性较好' if chg > 0 and avg_change > 0 else '走势独立于板块，需关注独立逻辑'}。"
        f"板块内共有{count}只人气股，整体赚钱效应{'较好' if avg_change > 0 else '偏差'}。"
    )

    return {
        "sector_change": f"{avg_change:+.2f}%",
        "sector_rank": sector_rank,
        "sector_count": count,
        "sector_stocks": sector_stocks,
        "analysis": analysis,
    }
