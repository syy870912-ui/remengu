"""Sector Classification for Stocks

Classifies stocks into sectors using:
1. Local mapping dictionary (well-known stocks)
2. Keyword-based heuristic (stock name patterns)
"""

import logging
from typing import Optional

logger = logging.getLogger("stock-analysis.sector")

# Known stock-to-sector mappings (from mockData + common knowledge)
SECTOR_MAP = {
    # 科技
    "000725": "科技", "002230": "科技", "002415": "科技", "002049": "科技",
    "002236": "科技", "002371": "科技", "002475": "科技", "300750": "科技",
    "688981": "科技", "300059": "科技", "300496": "科技", "002432": "科技",
    "603019": "科技", "002456": "科技", "300782": "科技",
    # 消费
    "600519": "消费", "000858": "消费", "000568": "消费", "002304": "消费",
    "603369": "消费", "600809": "消费", "000596": "消费", "002568": "消费",
    "600887": "消费", "603288": "消费",
    # 医药
    "000538": "医药", "600276": "医药", "300760": "医药", "002007": "医药",
    "600436": "医药", "300015": "医药", "300347": "医药", "000963": "医药",
    "002001": "医药", "603259": "医药",
    # 金融
    "601398": "金融", "601939": "金融", "600036": "金融", "601288": "金融",
    "600016": "金融", "601166": "金融", "601688": "金融", "600030": "金融",
    "601601": "金融", "601988": "金融",
    # 能源
    "601088": "能源", "600028": "能源", "601857": "能源", "600938": "能源",
    "002207": "能源",
    # 新能源
    "300274": "新能源", "002594": "新能源", "300750": "新能源",
    "002129": "新能源", "601012": "新能源", "600438": "新能源",
    # 军工
    "600893": "军工", "000768": "军工", "002179": "军工", "600760": "军工",
    "002414": "军工", "600967": "军工",
    # 地产
    "000002": "地产", "600048": "地产", "001979": "地产", "600340": "地产",
    "600208": "地产",
    # 农业
    "002714": "农业", "600438": "农业", "000876": "农业",
    # 传媒
    "300418": "传媒", "002602": "传媒", "300413": "传媒", "002555": "传媒",
    # 通信
    "600050": "通信", "600941": "通信", "000063": "通信",
    # 有色金属
    "601899": "有色金属", "603993": "有色金属", "002460": "有色金属",
    "600362": "有色金属", "000831": "有色金属",
}

# Keyword-based sector mapping
SECTOR_KEYWORDS = {
    "科技": ["科技", "信息", "软件", "芯片", "半导体", "电子", "计算机", "数据", "智能", "网安", "通信设备"],
    "消费": ["酒", "食品", "饮料", "乳业", "调味", "白酒", "啤酒", "餐饮", "旅游", "家电", "服装"],
    "医药": ["医药", "药", "生物", "医疗", "健康", "诊断", "疫苗"],
    "金融": ["银行", "证券", "保险", "信托", "金融"],
    "能源": ["石油", "煤炭", "天然气", "石化", "能源", "电力", "发电", "燃气"],
    "新能源": ["新能", "锂电", "光伏", "风能", "储能", "电池", "充电"],
    "军工": ["军工", "航天", "航空", "国防", "兵器"],
    "地产": ["地产", "置业", "建设", "房产", "城投"],
    "农业": ["农业", "种业", "化肥", "饲料", "畜牧", "养殖"],
    "传媒": ["传媒", "影视", "游戏", "文化", "娱乐", "传媒"],
    "通信": ["通信", "5G", "移动", "联通", "电信"],
    "有色金属": ["有色", "黄金", "铜", "铝", "锌", "锂", "稀土", "矿业"],
}


def classify_sector(code: str, name: str) -> Optional[str]:
    """
    Classify a stock into a sector.

    Priority:
    1. Exact match in SECTOR_MAP
    2. Keyword match in stock name
    3. None (unknown)
    """
    # 1. Exact match
    sector = SECTOR_MAP.get(code)
    if sector:
        return sector

    # 2. Keyword match
    if name:
        for sector_name, keywords in SECTOR_KEYWORDS.items():
            for kw in keywords:
                if kw in name:
                    return sector_name

    return None


def batch_classify(stocks: list[dict]) -> list[dict]:
    """Classify sectors for a list of stock dicts. Mutates in place and returns."""
    for stock in stocks:
        if not stock.get("sector"):
            stock["sector"] = classify_sector(stock["code"], stock.get("name", ""))

    classified = sum(1 for s in stocks if s.get("sector"))
    logger.info(f"Classified {classified}/{len(stocks)} stocks into sectors")
    return stocks
