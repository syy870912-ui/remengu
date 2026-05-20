"""Section 11: 投资风险提示 (Risk Warning)"""

import random


def generate_risk_warning(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    code = stock["code"]
    sector = stock.get("sector", "市场")
    chg = stock.get("change_percent", 0) or 0

    base_risks = [
        f"1. 股票市场存在较大风险，股价受宏观经济、行业政策、市场情绪等多重因素影响，可能出现大幅波动。",
        f"2. {name}（{code}）近期涨跌幅较大，短期波动风险较高，请投资者理性分析，切勿盲目追涨杀跌。",
        f"3. {sector}行业受政策影响较大，政策调整可能对公司经营产生不确定性影响，需密切关注政策动向。",
    ]

    optional_risks = [
        f"4. 公司财务数据基于公开信息整理，可能存在滞后性，投资决策应综合多方信息独立判断。",
        f"5. 本报告仅供参考，不构成任何投资建议。投资者应根据自身风险承受能力做出独立投资决策。",
        f"6. 技术分析指标存在滞后性，历史走势不代表未来表现，技术面信号仅供参考。",
        f"7. 机构持仓数据存在披露时滞，实际持仓情况可能与公开数据存在差异。",
        f"8. 市场流动性风险：部分个股在极端行情下可能出现流动性不足的情况。",
    ]

    selected_optional = rng.sample(optional_risks, min(3, len(optional_risks)))

    content = "\n\n".join(base_risks + selected_optional)

    return {
        "content": content,
        "disclaimer": (
            "免责声明：本分析报告由AI系统自动生成，数据来源于公开市场信息。"
            "报告中的观点和结论仅供参考，不构成任何投资建议。"
            "投资者应独立判断并承担投资风险。"
            "过往业绩不代表未来表现，市场有风险，投资需谨慎。"
        ),
    }
