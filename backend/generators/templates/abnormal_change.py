"""Section 2: 异动原因分析 (Abnormal Change Analysis)"""

import random


def generate_abnormal_change(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    code = stock["code"]
    sector = stock.get("sector", "市场")
    chg = stock.get("change_percent", 0) or 0
    is_rise = chg > 0

    reasons = []

    # Policy reason
    policy_templates_rise = [
        f"近期国家出台多项支持{sector}行业发展的利好政策，市场预期改善明显，板块整体情绪升温，{name}作为龙头标的受到资金追捧。",
        f"监管部门发布{sector}行业规范发展指导意见，行业竞争格局有望优化，龙头公司有望受益，市场解读为长期利好。",
        f"中央经济工作会议对{sector}领域释放积极信号，市场预期后续将有更多配套政策落地，投资者信心增强。",
    ]
    policy_templates_fall = [
        f"监管层对{sector}行业出台新的规范措施，市场担忧短期盈利空间收窄，投资者风险偏好下降。",
        f"行业政策出现调整信号，市场预期{sector}板块可能面临更加严格的监管环境，资金选择暂时观望。",
    ]

    # Fundamental reason
    fund_templates_rise = [
        f"{name}最新财报显示营收同比增长超预期，净利润持续改善，机构纷纷上调盈利预测，基本面支撑股价走强。",
        f"公司产品销量创新高，产能利用率持续提升，毛利率环比改善，盈利能力增强。",
        f"{name}获得重大订单/合同，市场预期将显著增厚公司业绩，投资者看好中长期发展前景。",
    ]
    fund_templates_fall = [
        f"{name}最新财报显示业绩增速放缓，低于市场预期，部分机构下调盈利预测，短期股价承压。",
        f"公司主营产品价格近期出现回调，市场担忧毛利率收窄，盈利能力面临考验。",
    ]

    # Technical reason
    tech_templates_rise = [
        f"股价突破前期重要阻力位，量能有效配合，形成向上突破形态，短线动能较强，技术面信号积极。",
        f"多条均线呈现多头排列，MACD指标在零轴上方金叉，量价配合良好，技术面走强。",
    ]
    tech_templates_fall = [
        f"股价跌破关键支撑位，技术形态走坏，短线抛压加大，技术面发出调整信号。",
        f"MACD指标出现死叉信号，成交量萎缩，资金观望情绪浓厚，技术面偏弱。",
    ]

    # News reason
    news_templates_rise = [
        f"近日公司发布重要公告，市场解读偏正面，引发资金快速关注。同时板块内多只个股联动上涨，市场合力效应明显。",
        f"行业龙头公司发布利好消息，带动整个{sector}板块走强，{name}作为板块重要标的同步上涨。",
    ]
    news_templates_fall = [
        f"近日公司发布公告，市场解读偏谨慎，叠加板块整体走弱，股价出现明显回调。",
        f"{sector}板块龙头股出现调整，引发板块联动下跌，{name}受拖累跟跌。",
    ]

    templates = {
        "policy": policy_templates_rise if is_rise else policy_templates_fall,
        "fundamental": fund_templates_rise if is_rise else fund_templates_fall,
        "technical": tech_templates_rise if is_rise else tech_templates_fall,
        "news": news_templates_rise if is_rise else news_templates_fall,
    }

    titles = {
        "policy": "宏观政策面",
        "fundamental": "基本面驱动",
        "technical": "技术面信号",
        "news": "消息面催化",
    }

    # Pick 4 reasons
    selected_keys = rng.sample(list(templates.keys()), min(4, len(templates)))
    for key in selected_keys:
        reasons.append({
            "title": titles[key],
            "content": rng.choice(templates[key]),
        })

    summary = (
        f"综合来看，{name}今日异动主要受{'多重利好因素共振' if is_rise else '多方面因素共同影响'}，"
        f"{'市场情绪积极，短期有望延续强势格局' if is_rise else '建议投资者密切关注后续变化，谨慎操作'}。"
    )

    return {"reasons": reasons, "summary": summary}
