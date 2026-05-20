import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, TrendingUp, TrendingDown, Zap, Clock, ChevronRight, Flame, FileText, BarChart3, Bot, ArrowUpRight, Eye, Activity, Database, RefreshCw } from 'lucide-react'
import { getStocks, StockItem } from '../api/stocks'
import { getArticles, ArticleItem } from '../api/articles'
import { getSectors, getStats, SectorStatsItem, DashboardStats } from '../api/sectors'
import { changeColor, formatPercent, formatChange } from '../utils/format'
import { ChangeBadge, SectorTag, RatingBadge } from '../components/Badges'
import AdSlot from '../components/AdSlot'

const PAGE_SIZE = 50

export default function HomePage() {
  const [stocks, setStocks] = useState<StockItem[]>([])
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [sectorStats, setSectorStats] = useState<SectorStatsItem[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const [sectorFilter, setSectorFilter] = useState<string>('全部')
  const [changeFilter, setChangeFilter] = useState<string>('全部')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const loadStocks = useCallback(async () => {
    try {
      const changeTypeMap: Record<string, string | undefined> = {
        '全部': undefined,
        '上涨': 'up',
        '下跌': 'down',
        '涨停': 'limit_up',
        '跌停': 'limit_down'
      }
      const params: Parameters<typeof getStocks>[0] = {
        page,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sector: sectorFilter !== '全部' ? sectorFilter : undefined,
        change_type: changeTypeMap[changeFilter]
      }
      const response = await getStocks(params)
      setStocks(response.items)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error('Failed to load stocks:', err)
      setError('加载股票数据失败')
    }
  }, [page, debouncedSearch, sectorFilter, changeFilter])

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [stocksRes, articlesRes, sectorsRes, statsRes] = await Promise.all([
          getStocks({ page: 1, page_size: PAGE_SIZE }),
          getArticles({ page_size: 8 }),
          getSectors(),
          getStats()
        ])
        setStocks(stocksRes.items)
        setTotal(stocksRes.total)
        setTotalPages(stocksRes.totalPages)
        setArticles(articlesRes.items)
        setSectorStats(sectorsRes)
        setDashboardStats(statsRes)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('加载数据失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!loading) loadStocks()
  }, [loadStocks, loading])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [search])

  const risingCount = dashboardStats?.risingCount ?? 0
  const fallingCount = dashboardStats?.fallingCount ?? 0
  const totalStocks = dashboardStats?.totalStocks ?? 0

  /* ===== Loading State ===== */
  if (loading) {
    return (
      <div className="page-enter">
        {/* Hero Skeleton */}
        <div className="gradient-hero text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-8 w-96 bg-white/10 rounded-lg mb-3 animate-pulse" />
            <div className="h-4 w-[480px] bg-white/5 rounded mb-8 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-8 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-56 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-72 shrink-0 space-y-5">
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ===== Error State ===== */
  if (error) {
    return (
      <div className="page-enter">
        <div className="gradient-hero text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              股析<span className="text-red-400">AI</span>
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="card p-10 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-red-500 text-lg font-semibold mb-2">加载失败</p>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ===== Main Render ===== */
  return (
    <div className="page-enter">
      {/* ===== Hero Section ===== */}
      <section className="gradient-hero text-white" style={{background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 40%, #1a1a4e 70%, #0f172a 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-16">
          {/* Hero Headline */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-amber-400 text-sm font-semibold tracking-wide">每日 18:00 自动更新 · 东方财富人气榜</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3">
                用 <span className="text-red-400">AI</span> 读懂热门股票
              </h1>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                每日自动抓取东方财富人气榜前 <span className="text-white font-semibold">200</span> 只热门股票，
                通过多维度数据采集与 AI 分析，生成专业深度分析报告。
              </p>
            </div>
            {/* Quick Action */}
            <div className="shrink-0">
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 rounded-2xl text-sm font-semibold transition-all backdrop-blur"
              >
                <FileText className="w-4 h-4" />
                浏览全部报告
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1 - Total Stocks */}
            <div className="hero-stat-card group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500 rounded-t-[14px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="stat-label">热门股票</span>
              </div>
              <p className="stat-value">{totalStocks}</p>
              <p className="stat-sublabel">人气榜单 TOP 200</p>
            </div>

            {/* Card 2 - Rising */}
            <div className="hero-stat-card group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500 rounded-t-[14px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                </div>
                <span className="stat-label">今日上涨</span>
              </div>
              <p className="stat-value text-rise">{risingCount}</p>
              <p className="stat-sublabel">
                {totalStocks > 0 ? Math.round(risingCount / totalStocks * 100) : 0}% 占比
              </p>
            </div>

            {/* Card 3 - Falling */}
            <div className="hero-stat-card group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-[14px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="stat-label">今日下跌</span>
              </div>
              <p className="stat-value text-fall">{fallingCount}</p>
              <p className="stat-sublabel">
                {totalStocks > 0 ? Math.round(fallingCount / totalStocks * 100) : 0}% 占比
              </p>
            </div>

            {/* Card 4 - Articles */}
            <div className="hero-stat-card group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500 rounded-t-[14px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="stat-label">AI 报告</span>
              </div>
              <p className="stat-value text-blue-600">{dashboardStats?.totalArticles ?? 0}</p>
              <p className="stat-sublabel">{today} 已更新</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Main Content ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6 items-start">

          {/* ===== Stock List Main ===== */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="card card-hover mb-5 animate-fade-in">
              {/* Row 1: Title + Search + Filters */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Title */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-red-500/20">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm sm:text-base leading-none">人气热榜</h2>
                      <p className="text-[11px] text-gray-400 mt-0.5">TOP 200 热门股票</p>
                    </div>
                    <a
                      href="https://guba.eastmoney.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors ml-1"
                    >
                      数据来源：东方财富
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex-1" />

                  {/* Search */}
                  <div className="relative w-52 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索代码 / 名称..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>

                {/* Row 2: Change Filters + Sector Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Change Type Filter */}
                  <div className="filter-group">
                    {(['全部', '上涨', '下跌', '涨停', '跌停'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => { setChangeFilter(f); setPage(1) }}
                        className={`filter-pill ${
                          changeFilter === f
                            ? f === '上涨' || f === '涨停'
                              ? 'active-rise'
                              : f === '下跌' || f === '跌停'
                              ? 'active-fall'
                              : 'active-neutral'
                            : ''
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Sector Filter Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => { setSectorFilter('全部'); setPage(1) }}
                      className={`tag text-xs ${sectorFilter === '全部' ? 'tag-active' : 'tag-default'}`}
                    >
                      全部板块
                    </button>
                    {sectorStats.slice(0, 10).map(s => (
                      <button
                        key={s.sector}
                        onClick={() => { setSectorFilter(s.sector); setPage(1) }}
                        className={`tag text-xs ${sectorFilter === s.sector ? 'tag-active' : 'tag-default'}`}
                      >
                        {s.sector}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto scrollbar-thin">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-16 text-center">排名</th>
                      <th>代码</th>
                      <th>名称</th>
                      <th className="hidden sm:table-cell">板块</th>
                      <th className="text-right">最新价</th>
                      <th className="text-right">涨跌幅</th>
                      <th className="text-right hidden md:table-cell">涨跌额</th>
                      <th className="text-center">AI 报告</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stocks.map((stock, idx) => (
                      <StockRow key={stock.code} stock={stock} index={idx} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <span className="text-xs text-gray-500">
                    共 <span className="font-semibold text-gray-700">{total}</span> 只
                    · 第 <span className="font-semibold text-gray-700">{page}</span> / {totalPages} 页
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="pagination-btn px-3"
                    >
                      上一页
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pg: number
                      if (totalPages <= 5) {
                        pg = i + 1
                      } else if (page <= 3) {
                        pg = i + 1
                      } else if (page >= totalPages - 2) {
                        pg = totalPages - 4 + i
                      } else {
                        pg = page - 2 + i
                      }
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`pagination-btn w-9 h-9 ${pg === page ? 'active' : ''}`}
                        >
                          {pg}
                        </button>
                      )
                    })}
                    <span className="text-xs text-gray-400 px-1">···</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="pagination-btn px-3"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== Sidebar ===== */}
          <div className="w-72 shrink-0 hidden lg:block space-y-5">

            {/* Data Source Card */}
            <div className="sidebar-card animate-fade-in">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">数据来源</h3>
                  <p className="text-[11px] text-gray-400">东方财富股吧人气榜</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-6">
                每个交易日 <span className="font-semibold text-gray-700">15:30</span> 收盘后，
                系统自动采集人气榜前 <span className="font-semibold text-brand">200</span> 名股票并生成 AI 报告。
              </p>
              <div className="flex items-center gap-2 mt-4 px-3 py-2.5 bg-emerald-50 rounded-xl">
                <div className="live-dot" />
                <span className="text-[12px] text-emerald-700 font-medium">系统运行中 · 今日 18:00 更新</span>
              </div>
            </div>

            {/* Latest Articles */}
            <div className="sidebar-card animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  最新报告
                </h3>
                <Link to="/articles" className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-0.5 transition-colors">
                  全部 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-1">
                {articles.map(art => (
                  <Link key={art.id} to={`/article/${art.stockCode}`} className="block group">
                    <div className="flex items-start gap-2.5 p-2.5 -mx-1 rounded-xl hover:bg-gray-50 transition-all duration-150">
                      <div className="shrink-0 mt-0.5">
                        <RatingBadge rating={art.rating} className="scale-90 origin-left" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-gray-700 group-hover:text-brand leading-snug line-clamp-2 transition-colors font-medium">{art.title}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{art.stockCode} · {art.createdAt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sector Overview */}
            <div className="sidebar-card animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  板块涨跌
                </h3>
                <Link to="/sectors" className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-0.5 transition-colors">
                  详情 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-0.5">
                {sectorStats.slice(0, 8).map(s => (
                  <Link
                    key={s.sector}
                    to={`/sectors?sector=${s.sector}`}
                    className="flex items-center justify-between p-2 -mx-1 rounded-lg hover:bg-gray-50 transition-all duration-150 group"
                  >
                    <span className="text-[13px] text-gray-700 group-hover:text-brand transition-colors font-medium">{s.sector}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{s.count}只</span>
                      <span className={`text-[13px] font-bold tabular-nums ${changeColor(s.avgChange)}`}>
                        {formatPercent(s.avgChange)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <AdSlot size="rectangle" label="侧边广告位" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Stock Table Row ===== */
function StockRow({ stock, index }: { stock: StockItem; index: number }) {
  const changePercent = stock.changePercent ?? 0
  const change = stock.change ?? 0
  const isRise = changePercent >= 0
  const isLimit = Math.abs(changePercent) >= 9.9

  const rankClass =
    stock.rank === 1 ? 'rank-1' :
    stock.rank === 2 ? 'rank-2' :
    stock.rank === 3 ? 'rank-3' : 'rank-default'

  const animDelay = `${Math.min(index, 20) * 30}ms`

  return (
    <tr
      className="group"
      style={{animation: `fadeIn 0.3s ease-out ${animDelay} both`}}
    >
      <td className="text-center">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${rankClass}`}>
          {stock.rank}
        </span>
      </td>
      <td>
        <span className="font-mono text-xs text-gray-400 tracking-tight">{stock.code}</span>
      </td>
      <td>
        <Link
          to={`/article/${stock.code}`}
          className="font-semibold text-sm text-gray-900 hover:text-brand transition-colors flex items-center gap-1.5 group/name"
        >
          {stock.name}
          {isLimit && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isRise ? 'bg-rise text-white' : 'bg-fall text-white'}`}>
              {isRise ? '涨停' : '跌停'}
            </span>
          )}
          <ArrowUpRight className="w-3 h-3 text-gray-300 group-hover/name:text-brand opacity-0 group-hover/name:opacity-100 transition-all" />
        </Link>
      </td>
      <td className="hidden sm:table-cell">
        <SectorTag sector={stock.sector} />
      </td>
      <td className="text-right num-highlight text-sm text-gray-900 font-medium">{(stock.price ?? 0).toFixed(2)}</td>
      <td className="text-right">
        <ChangeBadge change={changePercent} />
      </td>
      <td className="text-right tabular-nums text-sm hidden md:table-cell">
        <span className={changeColor(change)}>{formatChange(change)}</span>
      </td>
      <td className="text-center">
        {stock.hasArticle ? (
          <Link
            to={`/article/${stock.code}`}
            className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-semibold transition-colors hover:gap-1.5"
          >
            查看
            <ChevronRight className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-xs text-gray-300">待生成</span>
        )}
      </td>
    </tr>
  )
}
