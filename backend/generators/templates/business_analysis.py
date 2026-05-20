"""Section 5: 公司主营业务及市场环境分析 (Business Analysis)"""

import random


BUSINESS_TEMPLATES = {
    "科技": {
        "main": [
            "{name}是一家专注于{sub}领域的科技企业，核心业务涵盖{biz1}、{biz2}和{biz3}。"
            "公司拥有自主研发的核心技术团队，在行业内具有一定的技术壁垒和竞争优势。",
        ],
        "market": [
            "当前{sector}行业正处于快速发展期，国家政策持续加码，数字化转型加速推进。"
            "AI、云计算、大数据等新兴技术为行业带来新的增长空间，市场前景广阔。"
            "但行业竞争也日趋激烈，技术迭代速度快，企业需要持续投入研发保持竞争力。",
        ],
        "sub_fields": ["人工智能", "云计算", "大数据", "物联网", "网络安全", "芯片设计"],
        "sub_biz": ["软件研发", "系统集成", "技术服务", "产品销售", "解决方案"],
    },
    "消费": {
        "main": [
            "{name}是{sector}行业的龙头企业，主营业务包括{biz1}、{biz2}和{biz3}。"
            "公司品牌知名度高，渠道覆盖全国，在消费者心中建立了良好的品牌形象。",
        ],
        "market": [
            "国内{sector}市场规模持续扩大，消费升级趋势明显，消费者对品质和品牌的追求日益增强。"
            "但同时行业竞争加剧，新消费品牌不断涌现，传统企业面临转型升级压力。",
        ],
        "sub_fields": ["高端白酒", "食品加工", "日化用品", "家用电器", "餐饮服务"],
        "sub_biz": ["产品制造", "品牌运营", "渠道分销", "电商零售", "供应链管理"],
    },
    "医药": {
        "main": [
            "{name}是一家{sector}领域的综合性企业，业务覆盖{biz1}、{biz2}和{biz3}。"
            "公司拥有完善的产品线和研发体系，在细分市场具有较强竞争力。",
        ],
        "market": [
            "{sector}行业受到人口老龄化和健康意识提升的双重驱动，市场空间持续扩大。"
            "集采政策对行业格局产生深远影响，创新药和高端医疗器械成为企业竞争重点。"
            "研发投入加大、监管趋严，行业进入优胜劣汰阶段。",
        ],
        "sub_fields": ["创新药", "中药", "医疗器械", "CXO服务", "生物制品"],
        "sub_biz": ["药品研发", "生产制造", "商业流通", "医疗服务", "原料供应"],
    },
    "金融": {
        "main": [
            "{name}是{sector}行业的重要参与者，主要经营{biz1}、{biz2}等业务。"
            "公司资产规模庞大，客户基础广泛，在行业中占据重要地位。",
        ],
        "market": [
            "金融行业监管政策持续完善，利率市场化改革深入推进，金融科技加速渗透。"
            "行业整体盈利能力保持稳定，但面临息差收窄、资产质量管控等挑战。",
        ],
        "sub_fields": ["商业银行", "证券经纪", "保险", "信托", "基金管理"],
        "sub_biz": ["存贷款业务", "投资银行", "资产管理", "财富管理", "风险控制"],
    },
    "default": {
        "main": [
            "{name}是{sector}行业的重要企业，主营业务涵盖{biz1}、{biz2}和{biz3}。"
            "公司在细分领域具有一定的市场地位和竞争优势。",
        ],
        "market": [
            "{sector}行业整体运行平稳，政策环境保持稳定。"
            "宏观经济基本面支撑行业长期发展，但短期面临一定的周期性波动。"
            "行业集中度逐步提升，龙头企业有望持续受益。",
        ],
        "sub_fields": ["制造业", "服务业", "贸易", "物流", "房地产"],
        "sub_biz": ["产品制造", "销售推广", "技术研发", "供应链管理", "客户服务"],
    },
}


def generate_business_analysis(stock: dict, rng: random.Random) -> dict:
    name = stock["name"]
    sector = stock.get("sector", "其他")

    template_set = BUSINESS_TEMPLATES.get(sector, BUSINESS_TEMPLATES["default"])
    sub_fields = template_set["sub_fields"]
    sub_biz = template_set["sub_biz"]

    main_biz = rng.choice(template_set["main"]).format(
        name=name,
        sector=sector,
        sub=rng.choice(sub_fields),
        biz1=rng.choice(sub_biz),
        biz2=rng.choice(sub_biz),
        biz3=rng.choice(sub_biz),
    )

    market_env = rng.choice(template_set["market"]).format(sector=sector)

    return {
        "main_business": main_biz,
        "market_environment": market_env,
    }
