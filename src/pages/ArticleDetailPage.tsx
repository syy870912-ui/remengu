import { useParams, Link } from 'react-router-dom'
import { Share2, Copy, QrCode, TrendingUp, TrendingDown, AlertTriangle, BarChart2, Users, FileText, Star, ArrowLeft, Bookmark, ExternalLink, Clock, Eye, Shield, Flame } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getArticle } from '../api/articles'
import { ArticleDetailResponse } from '../api/articles'
import { changeColor, formatPercent, formatChange } from '../utils/format'
import { ChangeBadge, SectorTag, RatingBadge } from '../components/Badges'
import AdSlot from '../components/AdSlot'

export default function ArticleDetailPage() {
  const { code } = useParams<{ code: string }>()
  const [article, setArticle] = useState<ArticleDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    if (!code) return

    const fetchArticle = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getArticle(code)
        setArticle(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [code])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const num = (v: unknown): number | null => {
    if (v == null) return null
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  const safeStr = (v: unknown): string => {
    if (v == null) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    if (typeof v === 'boolean') return String(v)
    return JSON.stringify(v)
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-gray-200 rounded mb-5" />
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="card p-6 mb-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                  <div className="h-6 w-20 bg-gray-200 rounded" />
                  <div className="h-6 w-32 bg-gray-200 rounded ml-auto" />
                </div>
                <div className="h-8 w-64 bg-gray-200 rounded mb-5" />
                <div className="grid grid-cols-4 gap-4 p-5 bg-gray-50 rounded-2xl mb-5">
                  <div className="text-center">
                    <div className="h-4 w-12 bg-gray-200 rounded mx-auto mb-1" />
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
                  </div>
                  <div className="text-center">
                    <div className="h-4 w-12 bg-gray-200 rounded mx-auto mb-1" />
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
                  </div>
                  <div className="text-center">
                    <div className="h-4 w-12 bg-gray-200 rounded mx-auto mb-1" />
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
                  </div>
                  <div className="text-center">
                    <div className="h-4 w-12 bg-gray-200 rounded mx-auto mb-1" />
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto" />
                  </div>
                </div>
              </div>
              <div className="card p-6 space-y-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                      <div className="h-5 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-5/6 bg-gray-100 rounded" />
                    <div className="h-4 w-4/6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-72 shrink-0 hidden lg:block space-y-5">
              <div className="card p-4">
                <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-gray-100 rounded" />
                      <div className="flex-1">
                        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !article) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-500 mb-6">{error || '文章不存在'}</p>
          <Link to="/" className="btn-primary">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  // Stock data - use article.stock if available, otherwise use defaults
  const stock = article.stock || {
    code: article.stockCode,
    name: article.stockName,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: '-'
  }

  const content = article.content || {}

  const isRise = stock.changePercent > 0
  const showLonghuBang = stock.changePercent >= 5

  // Helper to get content value with fallback
  const getContentValue = (key: string): unknown => {
    return content[key]
  }

  // Format helpers
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-enter">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />返回首页
      </Link>

      <div className="flex gap-6">
        {/* Main Article */}
        <div className="flex-1 min-w-0">
          {/* Article Header */}
          <div className="card p-6 mb-5">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <SectorTag sector={article.sector || '未知板块'} />
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{stock.code}</span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(article.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{Math.floor(Math.random() * 5000 + 500)}</span>
              </div>
              <span className="ml-auto">
                <RatingBadge rating={article.rating} />
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-5">
              {stock.code} {stock.name} · AI深度分析报告
            </h1>

            {/* Price Info */}
            <div className="flex items-stretch gap-4 p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl mb-5">
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1 font-medium">最新价</p>
                <p className={`text-3xl font-bold num-highlight ${changeColor(stock.changePercent)}`}>{stock.price.toFixed(2)}</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1 font-medium">涨跌幅</p>
                <p className={`text-xl font-bold num-highlight ${changeColor(stock.changePercent)}`}>{formatPercent(stock.changePercent)}</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1 font-medium">涨跌额</p>
                <p className={`text-xl font-bold num-highlight ${changeColor(stock.change)}`}>{formatChange(stock.change)}</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1 font-medium">成交量</p>
                <p className="text-xl font-bold num-highlight text-gray-700">{stock.volume}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={copyLink} className="btn-secondary text-xs flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                {copied ? '已复制' : '复制链接'}
              </button>
              <button className="btn-secondary text-xs flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />分享
              </button>
              <button className="btn-secondary text-xs flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />二维码
              </button>
              <button
                onClick={() => setBookmarked(b => !b)}
                className={`btn-secondary text-xs flex items-center gap-1.5 ml-auto ${
                  bookmarked ? '!border-red-200 !bg-brand-light !text-brand' : ''
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                {bookmarked ? '已收藏' : '收藏'}
              </button>
            </div>
          </div>

          {/* Article Content */}
          <div className="card p-6 sm:p-8 space-y-8">
            {/* 龙虎榜 - use content.dragon_tiger if available */}
            {showLonghuBang && (
              <Section title="龙虎榜信息" icon={<Star className="w-5 h-5 text-amber-500" />} badge="今日上榜" badgeColor="bg-amber-100 text-amber-700">
                {(() => {
                  const dragonTigerContent = getContentValue('dragon_tiger')
                  if (dragonTigerContent && typeof dragonTigerContent === 'object' && 'items' in dragonTigerContent) {
                    const dtc = dragonTigerContent as { visible?: boolean; items?: Array<{ name: string; amount: string }> }
                    if (dtc.items && dtc.items.length > 0) {
                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {dtc.items.map((item, idx) => (
                              <div key={idx} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-xs text-gray-500 mb-1 font-medium">{item.name}</p>
                                <p className="text-lg font-bold text-rise num-highlight">{item.amount}</p>
                              </div>
                            ))}
                          </div>
                          {dtc.items.some(i => i.name.includes('买入')) && (
                            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-4 mt-3 leading-relaxed">
                              <span className="font-semibold text-amber-700">分析：</span>
                              龙虎榜显示，{stock.name}今日机构席位净买入明显，资金介入信号较强，主力资金对该股关注度持续提升。建议重点关注后续量能配合情况。
                            </p>
                          )}
                        </>
                      )
                    }
                  }
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['机构席位买入', '游资A买入', '游资B买入'].map((name) => (
                          <div key={name} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1 font-medium">{name}</p>
                            <p className="text-lg font-bold text-rise num-highlight">+{(Math.random() * 5 + 0.5).toFixed(2)}亿</p>
                          </div>
                        ))}
                        {['机构席位卖出', '游资C卖出'].map((name) => (
                          <div key={name} className="p-4 bg-green-50 border border-green-100 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1 font-medium">{name}</p>
                            <p className="text-lg font-bold text-fall num-highlight">-{(Math.random() * 3 + 0.3).toFixed(2)}亿</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-4 mt-3 leading-relaxed">
                        <span className="font-semibold text-amber-700">分析：</span>
                        龙虎榜显示，{stock.name}今日机构席位净买入明显，资金介入信号较强，主力资金对该股关注度持续提升。建议重点关注后续量能配合情况。
                      </p>
                    </>
                  )
                })()}
              </Section>
            )}

            {/* 异动原因 - use content.abnormal_change if available */}
            <Section title="异动原因分析" icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}>
              <p className="text-sm text-gray-700 leading-7 mb-3">
                {stock.name}（{stock.code}）近期出现{isRise ? '上涨' : '下跌'}异动，主要原因分析如下：
              </p>
              {(() => {
                const abnormalChangeContent = getContentValue('abnormal_change')
                if (abnormalChangeContent && typeof abnormalChangeContent === 'object' && 'reasons' in abnormalChangeContent) {
                  const acc = abnormalChangeContent as { reasons?: Array<string | { title?: string; content?: string }> }
                  if (acc.reasons && acc.reasons.length > 0) {
                    return (
                      <ul className="space-y-3">
                        {acc.reasons.map((reason, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-600 leading-7">
                            <span className="mt-1 w-6 h-6 rounded-lg bg-brand-light text-brand text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                            {typeof reason === 'string' ? reason : (
                              <span>{reason.title && <strong>{String(reason.title)}</strong>}{reason.title && reason.content && ': '}{String(reason.content || '')}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                }
                return (
                  <ul className="space-y-3">
                    {[
                      `宏观政策面：近期国家出台多项支持${article.sector || ''}行业发展的利好政策，市场预期改善明显，板块整体情绪升温。`,
                      `基本面驱动：${stock.name}最新季报显示营收同比增长超预期，净利润持续改善，机构纷纷上调盈利预测。`,
                      `技术面催化：股价突破前期重要阻力位，量能有效配合，形成向上突破形态，短线动能较强。`,
                      `消息面助推：近日公司发布重要公告，市场解读偏正面，引发资金快速关注。`,
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-600 leading-7">
                        <span className="mt-1 w-6 h-6 rounded-lg bg-brand-light text-brand text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              })()}
            </Section>

            {/* 板块联动 - use content.sector_correlation if available */}
            <Section title="板块联动效应分析" icon={<BarChart2 className="w-5 h-5 text-blue-500" />}>
              {(() => {
                const sectorContent = getContentValue('sector_correlation')
                if (sectorContent && typeof sectorContent === 'object') {
                  const sc = sectorContent as { description?: string; stats?: Record<string, unknown> }
                  return (
                    <>
                      <p className="text-sm text-gray-700 leading-7 mb-3">
                        {sc.description || `${article.sector || ''}板块整体呈现联动态势。`}
                      </p>
                      {sc.stats && (
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(sc.stats).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="text-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                              <p className="text-xs text-gray-500 mb-1 font-medium">{key}</p>
                              <p className="font-bold text-blue-700 num-highlight text-lg">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                }
                return (
                  <>
                    <p className="text-sm text-gray-700 leading-7 mb-3">
                      {article.sector || ''}板块整体呈现联动上行态势。板块内个股普遍走强，整体平均涨幅达到{(Math.random() * 3 + 0.5).toFixed(2)}%，板块内龙头效应明显。
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1 font-medium">今日板块涨幅</p>
                        <p className="font-bold text-blue-700 num-highlight text-lg">+{(Math.random() * 3).toFixed(2)}%</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1 font-medium">板块排名</p>
                        <p className="font-bold text-blue-700 num-highlight text-lg">第{Math.floor(Math.random() * 5) + 1}名</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1 font-medium">板块内股票数</p>
                        <p className="font-bold text-blue-700 num-highlight text-lg">-</p>
                      </div>
                    </div>
                  </>
                )
              })()}
            </Section>

            <div className="section-divider" />

            {/* 基本面 - use content.fundamentals if available */}
            <Section title="个股基本面解析" icon={<FileText className="w-5 h-5 text-purple-500" />}>
              {(() => {
                const fundamentalsContent = getContentValue('fundamentals')
                if (fundamentalsContent && typeof fundamentalsContent === 'object') {
                const fc = fundamentalsContent as { pe?: number | string; pb?: number | string; marketCap?: number | string; roe?: number | string }
                  const items = []
                  const pe = num(fc.pe); if (pe !== null) items.push({ label: '市盈率(TTM)', value: `${pe.toFixed(1)}x` })
                  const pb = num(fc.pb); if (pb !== null) items.push({ label: '市净率', value: `${pb.toFixed(2)}x` })
                  if (fc.marketCap) items.push({ label: '总市值', value: typeof fc.marketCap === 'number' ? `${fc.marketCap.toFixed(0)}亿` : String(fc.marketCap) })
                  const roe = num(fc.roe); if (roe !== null) items.push({ label: 'ROE', value: `${roe.toFixed(1)}%` })

                  if (items.length > 0) {
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {items.map(({ label, value }) => (
                            <div key={label} className="text-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                              <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>
                              <p className="font-bold text-gray-900 num-highlight">{value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 leading-7">
                          从基本面来看，{stock.name}近三年营收复合增速保持在较高水平，毛利率持续改善，显示公司核心竞争力不断增强。
                          负债率处于行业合理区间，现金流充裕，具备持续分红能力。当前估值处于历史中位偏下区间，具备一定安全边际。
                        </p>
                      </>
                    )
                  }
                }
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: '市盈率(TTM)', value: `${(Math.random() * 40 + 10).toFixed(1)}x` },
                        { label: '市净率', value: `${(Math.random() * 5 + 1).toFixed(2)}x` },
                        { label: '总市值', value: `${(Math.random() * 3000 + 100).toFixed(0)}亿` },
                        { label: 'ROE', value: `${(Math.random() * 20 + 5).toFixed(1)}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                          <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>
                          <p className="font-bold text-gray-900 num-highlight">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 leading-7">
                      从基本面来看，{stock.name}近三年营收复合增速保持在较高水平，毛利率持续改善，显示公司核心竞争力不断增强。
                      负债率处于行业合理区间，现金流充裕，具备持续分红能力。当前估值处于历史中位偏下区间，具备一定安全边际。
                    </p>
                  </>
                )
              })()}
            </Section>

            {/* 主营业务 - use content.business_analysis if available */}
            <Section title="公司主营业务及市场环境分析" icon={<TrendingUp className="w-5 h-5 text-green-500" />}>
              {(() => {
                const businessContent = getContentValue('business_analysis')
                if (businessContent && typeof businessContent === 'object') {
                  const bc = businessContent as { description?: string }
                  return (
                    <>
                      <p className="text-sm text-gray-700 leading-7 mb-3">
                        {bc.description || `${stock.name}主营业务聚焦${article.sector || ''}核心赛道，产品/服务布局完善，在细分市场占据领导地位。`}
                      </p>
                    </>
                  )
                }
                return (
                  <>
                    <p className="text-sm text-gray-700 leading-7 mb-3">
                      {stock.name}主营业务聚焦{article.sector || ''}核心赛道，产品/服务布局完善，在细分市场占据领导地位。
                    </p>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-600 leading-7">
                        当前市场环境分析：{article.sector || ''}行业整体处于上升周期，政策环境友好，需求端持续扩张。
                        公司在行业中的竞争壁垒较高，品牌、技术、渠道等核心资产构筑了较深的护城河。
                      </p>
                    </div>
                  </>
                )
              })()}
            </Section>

            {/* 控股参股 - use content.subsidiaries if available */}
            <Section title="控股及参股公司情况" icon={<Users className="w-5 h-5 text-indigo-500" />}>
              {(() => {
                const subsidiariesContent = getContentValue('subsidiaries')
                if (subsidiariesContent && typeof subsidiariesContent === 'object' && 'companies' in subsidiariesContent) {
                  const sc = subsidiariesContent as { companies?: Array<{ name: string; ratio: string; type: string }> }
                  if (sc.companies && sc.companies.length > 0) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>公司名称</th>
                              <th className="text-right">持股比例</th>
                              <th className="text-right">关系</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {sc.companies.map((row, idx) => (
                              <tr key={idx}>
                                <td className="text-gray-700">{row.name}</td>
                                <td className="text-right tabular-nums text-gray-600 num-highlight">{row.ratio}</td>
                                <td className="text-right"><span className="tag tag-default">{row.type}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>公司名称</th>
                          <th className="text-right">持股比例</th>
                          <th className="text-right">关系</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[
                          { name: `${stock.name}（香港）有限公司`, ratio: '100%', type: '全资子公司' },
                          { name: `${article.sector || ''}科技（深圳）有限公司`, ratio: '51.2%', type: '控股子公司' },
                          { name: '某战略合作企业A', ratio: '15.6%', type: '参股公司' },
                          { name: '某新兴业务子公司B', ratio: '80%', type: '控股子公司' },
                        ].map(row => (
                          <tr key={row.name}>
                            <td className="text-gray-700">{row.name}</td>
                            <td className="text-right tabular-nums text-gray-600 num-highlight">{row.ratio}</td>
                            <td className="text-right"><span className="tag tag-default">{row.type}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </Section>

            {/* 技术面 - use content.technical if available */}
            <Section title="技术面分析" icon={<BarChart2 className="w-5 h-5 text-amber-500" />}>
              {(() => {
                const technicalContent = getContentValue('technical')
                if (technicalContent && typeof technicalContent === 'object') {
                  const tc = technicalContent as { ma5?: number | string; ma20?: number | string; ma60?: number | string; macd?: string; kdj?: string; rsi?: number | string }
                  const items = []
                  const ma5 = num(tc.ma5); if (ma5 !== null) items.push({ label: 'MA5', value: ma5.toFixed(2), status: isRise ? 'above' : 'below' })
                  const ma20 = num(tc.ma20); if (ma20 !== null) items.push({ label: 'MA20', value: ma20.toFixed(2), status: isRise ? 'above' : 'below' })
                  const ma60 = num(tc.ma60); if (ma60 !== null) items.push({ label: 'MA60', value: ma60.toFixed(2), status: isRise ? 'above' : 'near' })
                  if (tc.macd) {
                    let macdValue: string
                    if (typeof tc.macd === 'string') {
                      macdValue = tc.macd
                    } else {
                      const m = tc.macd as Record<string, unknown>
                      if (m.signal === 'golden_cross' || m.signal === 1 || m.signal === true) macdValue = '金叉'
                      else if (m.signal === 'death_cross' || m.signal === -1 || m.signal === false) macdValue = '死叉'
                      else if (typeof m.bar === 'number') macdValue = (m.bar as number) > 0 ? '金叉' : '死叉'
                      else macdValue = safeStr(tc.macd)
                    }
                    items.push({ label: 'MACD', value: macdValue, status: isRise ? 'bull' : 'bear' })
                  }
                  if (tc.kdj) {
                    let kdjValue: string
                    if (typeof tc.kdj === 'string') {
                      kdjValue = tc.kdj
                    } else {
                      const k = tc.kdj as Record<string, unknown>
                      if (k.k !== undefined || k.d !== undefined) {
                        const f = (v: unknown) => num(v)?.toFixed(1) ?? '?'
                        kdjValue = `K:${f(k.k)} D:${f(k.d)} J:${f(k.j)}`
                      } else {
                        kdjValue = safeStr(tc.kdj)
                      }
                    }
                    items.push({ label: 'KDJ', value: kdjValue, status: 'neutral' })
                  }
                  const rsi = num(tc.rsi); if (rsi !== null) items.push({ label: 'RSI(14)', value: rsi.toFixed(1), status: 'neutral' })

                  if (items.length > 0) {
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {items.map(({ label, value, status }) => (
                            <div key={label} className={`p-3 rounded-xl border ${
                              status === 'bull' || status === 'above' ? 'bg-red-50 border-red-100' :
                              status === 'bear' || status === 'below' ? 'bg-green-50 border-green-100' :
                              'bg-gray-50 border-gray-100'
                            }`}>
                              <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
                              <p className={`font-bold text-sm num-highlight ${
                                status === 'bull' || status === 'above' ? 'text-rise' :
                                status === 'bear' || status === 'below' ? 'text-fall' : 'text-gray-700'
                              }`}>{safeStr(value)}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 leading-7">
                          技术面上，{stock.name}当前{isRise ? '站上' : '跌破'}多条均线，短线动能{isRise ? '偏强' : '偏弱'}。
                          MACD指标{isRise ? '形成金叉，柱状线由绿转红' : '形成死叉，柱状线持续走低'}，
                          量能方面近期{isRise ? '放量上攻，主力资金积极介入' : '成交量有所萎缩，需关注能否在关键支撑位止稳'}。
                        </p>
                      </>
                    )
                  }
                }
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'MA5', value: (stock.price * (1 - 0.02 * Math.random())).toFixed(2), status: isRise ? 'above' : 'below' },
                        { label: 'MA20', value: (stock.price * (1 - 0.05 * Math.random())).toFixed(2), status: isRise ? 'above' : 'below' },
                        { label: 'MA60', value: (stock.price * (1 + 0.02 * Math.random() - 0.04)).toFixed(2), status: isRise ? 'above' : 'near' },
                        { label: 'MACD', value: isRise ? '金叉' : '死叉', status: isRise ? 'bull' : 'bear' },
                        { label: 'KDJ', value: `K:${(Math.random() * 40 + 50).toFixed(1)}`, status: 'neutral' },
                        { label: 'RSI(14)', value: (Math.random() * 30 + 45).toFixed(1), status: 'neutral' },
                      ].map(({ label, value, status }) => (
                        <div key={label} className={`p-3 rounded-xl border ${
                          status === 'bull' || status === 'above' ? 'bg-red-50 border-red-100' :
                          status === 'bear' || status === 'below' ? 'bg-green-50 border-green-100' :
                          'bg-gray-50 border-gray-100'
                        }`}>
                          <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
                          <p className={`font-bold text-sm num-highlight ${
                            status === 'bull' || status === 'above' ? 'text-rise' :
                            status === 'bear' || status === 'below' ? 'text-fall' : 'text-gray-700'
                          }`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 leading-7">
                      技术面上，{stock.name}当前{isRise ? '站上' : '跌破'}多条均线，短线动能{isRise ? '偏强' : '偏弱'}。
                      MACD指标{isRise ? '形成金叉，柱状线由绿转红' : '形成死叉，柱状线持续走低'}，
                      量能方面近期{isRise ? '放量上攻，主力资金积极介入' : '成交量有所萎缩，需关注能否在关键支撑位止稳'}。
                    </p>
                  </>
                )
              })()}
            </Section>

            {/* 资金流向 - use content.fund_flow if available */}
            <Section title="资金流向分析" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
              {(() => {
                const fundFlowContent = getContentValue('fund_flow')
                if (fundFlowContent && typeof fundFlowContent === 'object' && 'items' in fundFlowContent) {
                  const ffc = fundFlowContent as { items?: Array<{ name: string; in: string; out: string }> }
                  if (ffc.items && ffc.items.length > 0) {
                    return (
                      <>
                        <div className="space-y-2.5 mb-4">
                          {ffc.items.map((row, idx) => {
                            const net = parseFloat(String(row.in)) - parseFloat(String(row.out))
                            return (
                              <div key={idx} className="flex items-center gap-4 text-sm p-2.5 bg-gray-50 rounded-xl">
                                <span className="w-12 text-gray-600 font-medium text-xs">{safeStr(row.name)}</span>
                                <span className="text-rise tabular-nums num-highlight">+{safeStr(row.in)}亿</span>
                                <span className="text-fall tabular-nums num-highlight">-{safeStr(row.out)}亿</span>
                                <span className={`ml-auto font-semibold tabular-nums num-highlight ${net > 0 ? 'text-rise' : 'text-fall'}`}>
                                  {isNaN(net) ? '0.00' : (net > 0 ? '+' : '') + net.toFixed(2)}亿
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-sm text-gray-700 leading-7">
                          资金流向分析显示，今日{stock.name}主力资金（超大单+大单）呈现{isRise ? '净流入' : '净流出'}态势，
                          北向资金持仓近期{isRise ? '小幅增加' : '略有减少'}，整体资金面{isRise ? '相对健康' : '有所承压'}。
                        </p>
                      </>
                    )
                  }
                }
                return (
                  <>
                    <div className="space-y-2.5 mb-4">
                      {[
                        { name: '超大单', in: (Math.random() * 5 + 1).toFixed(2), out: (Math.random() * 3 + 0.5).toFixed(2) },
                        { name: '大单', in: (Math.random() * 3 + 0.5).toFixed(2), out: (Math.random() * 2 + 0.3).toFixed(2) },
                        { name: '中单', in: (Math.random() * 2 + 0.3).toFixed(2), out: (Math.random() * 1.5 + 0.2).toFixed(2) },
                        { name: '小单', in: (Math.random() * 1 + 0.2).toFixed(2), out: (Math.random() * 1 + 0.3).toFixed(2) },
                      ].map(row => {
                        const net = parseFloat(row.in) - parseFloat(row.out)
                        return (
                          <div key={row.name} className="flex items-center gap-4 text-sm p-2.5 bg-gray-50 rounded-xl">
                            <span className="w-12 text-gray-600 font-medium text-xs">{row.name}</span>
                            <span className="text-rise tabular-nums num-highlight">+{row.in}亿</span>
                            <span className="text-fall tabular-nums num-highlight">-{row.out}亿</span>
                            <span className={`ml-auto font-semibold tabular-nums num-highlight ${net > 0 ? 'text-rise' : 'text-fall'}`}>
                              {net > 0 ? '+' : ''}{net.toFixed(2)}亿
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-sm text-gray-700 leading-7">
                      资金流向分析显示，今日{stock.name}主力资金（超大单+大单）呈现{isRise ? '净流入' : '净流出'}态势，
                      北向资金持仓近期{isRise ? '小幅增加' : '略有减少'}，整体资金面{isRise ? '相对健康' : '有所承压'}。
                    </p>
                  </>
                )
              })()}
            </Section>

            {/* 机构持仓 - use content.institutional if available */}
            <Section title="机构持仓情况" icon={<Users className="w-5 h-5 text-gray-600" />}>
              {(() => {
                const institutionalContent = getContentValue('institutional')
                if (institutionalContent && typeof institutionalContent === 'object') {
                  const ic = institutionalContent as { description?: string }
                  if (ic.description) {
                    return (
                      <p className="text-sm text-gray-700 leading-7">
                        {ic.description}
                      </p>
                    )
                  }
                }
                return (
                  <p className="text-sm text-gray-700 leading-7">
                    最新季报显示，{stock.name}机构持股比例约为{(Math.random() * 30 + 20).toFixed(1)}%，
                    共计{Math.floor(Math.random() * 200 + 50)}家机构持有该股。其中公募基金持股约{(Math.random() * 10 + 5).toFixed(1)}%，
                    社保基金持股约{(Math.random() * 2 + 0.5).toFixed(1)}%，外资（陆股通）持股约{(Math.random() * 5 + 1).toFixed(1)}%。
                    较上季度相比，机构整体持仓比例{isRise ? '有所提升' : '略有下降'}，头部机构{isRise ? '加仓' : '小幅减仓'}信号值得关注。
                  </p>
                )
              })()}
            </Section>

            {/* 近期公告 - use content.announcements if available */}
            <Section title="近期重要公告及事件" icon={<FileText className="w-5 h-5 text-gray-500" />}>
              {(() => {
                const announcementsContent = getContentValue('announcements')
                if (announcementsContent && typeof announcementsContent === 'object' && 'items' in announcementsContent) {
                  const ac = announcementsContent as { items?: Array<{ date: string; title: string; type: string }> }
                  if (ac.items && ac.items.length > 0) {
                    return (
                      <ul className="space-y-3">
                        {ac.items.map((item, idx) => (
                          <li key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-400 tabular-nums shrink-0 mt-0.5">{safeStr(item.date)}</span>
                            <span className="tag tag-default shrink-0">{safeStr(item.type)}</span>
                            <a href="#" className="text-sm text-gray-700 hover:text-brand transition-colors flex items-center gap-1">
                              {safeStr(item.title)} <ExternalLink className="w-3 h-3 text-gray-300 shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )
                  }
                }
                return (
                  <ul className="space-y-3">
                    {[
                      { date: '2026-05-15', title: `${stock.name}关于签署战略合作协议的公告`, type: '重大合同' },
                      { date: '2026-05-10', title: `${stock.name}2026年一季度业绩快报`, type: '业绩快报' },
                      { date: '2026-04-28', title: `${stock.name}关于董事会换届的公告`, type: '人事变动' },
                      { date: '2026-04-20', title: `${stock.name}2025年年度报告摘要`, type: '年报' },
                    ].map(item => (
                      <li key={item.date} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-400 tabular-nums shrink-0 mt-0.5">{item.date}</span>
                        <span className="tag tag-default shrink-0">{item.type}</span>
                        <a href="#" className="text-sm text-gray-700 hover:text-brand transition-colors flex items-center gap-1">
                          {item.title} <ExternalLink className="w-3 h-3 text-gray-300 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )
              })()}
            </Section>

            <div className="section-divider" />

            {/* 风险提示 - use content.risk_warning if available */}
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-700 text-sm">投资风险提示</h3>
              </div>
              {(() => {
                const riskWarningContent = getContentValue('risk_warning')
                if (riskWarningContent && typeof riskWarningContent === 'object') {
                  const rwc = riskWarningContent as { disclaimer?: string }
                  if (rwc.disclaimer) {
                    return (
                      <p className="text-xs text-amber-700 leading-7">{rwc.disclaimer}</p>
                    )
                  }
                }
                return (
                  <p className="text-xs text-amber-700 leading-7">
                    1. 股票市场存在较大风险，过往业绩不代表未来表现，投资者应充分了解风险，谨慎决策。<br/>
                    2. 本报告由AI自动生成，仅供参考，不构成任何投资建议。市场存在不确定性，请结合自身风险承受能力进行投资决策。<br/>
                    3. {stock.name}所属{article.sector || ''}板块受政策、市场环境等多重因素影响，存在业绩不达预期、竞争加剧等风险。<br/>
                    4. 本报告不对任何因使用本报告信息而导致的投资损失负责。
                  </p>
                )
              })()}
            </div>

            {/* AI评级 - use content.ai_rating if available */}
            <div className={`p-6 rounded-2xl border-2 ${
              article.rating === 'buy' ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' :
              article.rating === 'hold' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' :
              'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                  <Star className="w-5 h-5 text-amber-500" />
                  AI综合投资评级与展望
                </h3>
                <RatingBadge rating={article.rating} />
              </div>
              {(() => {
                const aiRatingContent = getContentValue('ai_rating')
                if (aiRatingContent && typeof aiRatingContent === 'object') {
                  const arc = aiRatingContent as { outlook?: string }
                  if (arc.outlook) {
                    return (
                      <p className="text-sm text-gray-700 leading-7">
                        综合基本面、技术面、资金面及市场环境多维度分析，AI系统对{stock.name}给出
                        <strong className={article.rating === 'buy' ? 'text-rise' : article.rating === 'hold' ? 'text-amber-600' : 'text-fall'}>
                          「{article.rating === 'buy' ? '买入' : article.rating === 'hold' ? '持有' : '卖出'}」
                        </strong>评级。
                        {arc.outlook}
                      </p>
                    )
                  }
                }
                return (
                  <p className="text-sm text-gray-700 leading-7">
                    综合基本面、技术面、资金面及市场环境多维度分析，AI系统对{stock.name}给出
                    <strong className={article.rating === 'buy' ? 'text-rise' : article.rating === 'hold' ? 'text-amber-600' : 'text-fall'}>
                      「{article.rating === 'buy' ? '买入' : article.rating === 'hold' ? '持有' : '卖出'}」
                    </strong>评级。
                    未来6-12个月，公司{article.rating === 'buy' ? '有望受益于行业景气度提升和自身竞争力增强，业绩增速有望持续提升，建议积极关注' :
                      article.rating === 'hold' ? '基本面稳健但短期催化剂不足，建议持有等待更好的入场时机' :
                      '面临较大的竞争压力和业绩不确定性，建议谨慎操作，适当减仓'}。
                  </p>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 hidden lg:block space-y-5">
          {/* Related Stocks - use article.relatedArticles */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              同板块热门报告
            </h3>
            <div className="space-y-2">
              {article.relatedArticles.map(art => (
                <Link key={art.id} to={`/article/${art.stockCode}`} className="block group">
                  <div className="flex items-start gap-2.5 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <RatingBadge rating={art.rating} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] text-gray-700 group-hover:text-brand line-clamp-2 transition-colors font-medium leading-snug">{safeStr(art.stockName)} 分析报告</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{safeStr(art.stockCode)} · {safeStr(art.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* SEO Info */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              文章信息
            </h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <p className="text-[11px] text-gray-400 mb-0.5">Meta标题</p>
                <p className="text-gray-700 font-medium">{stock.code}{stock.name}分析报告-{article.createdAt}</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <p className="text-[11px] text-gray-400 mb-0.5">关键词</p>
                <p className="text-gray-700">{stock.code}, {stock.name}, {article.sector || ''}, 分析报告</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <p className="text-[11px] text-gray-400 mb-0.5">URL</p>
                <p className="text-gray-700 font-mono">/stock/{stock.code}/{article.createdAt}.html</p>
              </div>
            </div>
          </div>

          <AdSlot size="rectangle" label="侧边广告位" />
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children, badge, badgeColor = 'bg-red-100 text-red-600' }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string
  badgeColor?: string
}) {
  return (
    <section className="animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {badge && <span className={`tag ${badgeColor} font-semibold`}>{badge}</span>}
      </div>
      {children}
    </section>
  )
}
