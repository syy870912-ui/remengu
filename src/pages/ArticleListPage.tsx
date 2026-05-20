import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, FileText, Sparkles, AlertCircle, ChevronRight } from 'lucide-react'
import { getArticles, ArticleItem, ArticleListResponse } from '../api/articles'
import { getSectors, getStats, DashboardStats, SectorStatsItem } from '../api/sectors'
import { RatingBadge, SectorTag } from '../components/Badges'
import AdSlot from '../components/AdSlot'

const PAGE_SIZE = 20

function SkeletonCard() {
  return (
    <div className="card p-5 flex items-start gap-4 animate-pulse">
      <div className="w-16 h-6 bg-gray-200 rounded-full shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full"></div>
          <div className="h-3 bg-gray-100 rounded w-5/6"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-4 bg-gray-100 rounded w-16"></div>
          <div className="h-4 bg-gray-100 rounded w-20"></div>
          <div className="h-4 bg-gray-100 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}

export default function ArticleListPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('全部')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)

  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [dates, setDates] = useState<string[]>([])
  const [sectorList, setSectorList] = useState<string[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [search])

  // Load data in parallel
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [articlesRes, sectorsRes, statsRes] = await Promise.all([
        getArticles({
          search: debouncedSearch || undefined,
          sector: sectorFilter !== '全部' ? sectorFilter : undefined,
          date: dateFilter || undefined,
          page,
          page_size: PAGE_SIZE,
        }),
        getSectors(),
        getStats(),
      ])

      setArticles(articlesRes.items)
      setTotal(articlesRes.total)
      setTotalPages(articlesRes.totalPages)
      setDates(articlesRes.dates)
      setSectorList(sectorsRes.map((s: SectorStatsItem) => s.sector))
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, sectorFilter, dateFilter, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [sectorFilter, dateFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-enter">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="gradient-brand w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">股票分析报告库</h1>
            <p className="text-sm text-gray-400">共 {total} 篇 AI 深度分析报告</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="card p-5 mb-5">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索股票代码、名称或关键词..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-300 appearance-none cursor-pointer transition-all"
                >
                  <option value="">全部日期</option>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Sector filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSectorFilter('全部')}
                className={`tag ${sectorFilter === '全部' ? 'tag-active' : 'tag-default'}`}
              >
                全部板块
              </button>
              {sectorList.map(s => (
                <button
                  key={s}
                  onClick={() => setSectorFilter(s)}
                  className={`tag ${sectorFilter === s ? 'tag-active' : 'tag-default'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-500 font-medium">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand/90 transition-colors"
              >
                重试
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="card p-16 text-center">
              <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">未找到相关股票分析报告</p>
              <p className="text-xs text-gray-300 mt-1">尝试调整筛选条件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(art => (
                <Link key={art.id} to={`/article/${art.stockCode}`} className="card card-hover p-5 flex items-start gap-4 block group">
                  <div className="shrink-0 mt-0.5">
                    <RatingBadge rating={art.rating} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors leading-snug mb-1.5">{art.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{art.summary}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{art.stockCode}</span>
                      <SectorTag sector={art.sector} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{art.createdAt}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-brand group-hover:translate-x-0.5 shrink-0 mt-1 transition-all" />
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 py-2">
              <button onClick={() => setPage(1)} disabled={page === 1} className="btn-secondary text-xs !py-1.5 !px-3 disabled:opacity-40">首页</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs !py-1.5 !px-3 disabled:opacity-40">上一页</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i))
                if (pg < 1 || pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                      pg === page ? 'gradient-brand text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs !py-1.5 !px-3 disabled:opacity-40">下一页</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="btn-secondary text-xs !py-1.5 !px-3 disabled:opacity-40">末页</button>
              <span className="text-xs text-gray-400 ml-2">共{totalPages}页</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 hidden lg:block space-y-5">
          {/* Stats */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              快速统计
            </h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-20"></div>
                    <div className="h-6 bg-gray-100 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-3">
                {[
                  { label: '累计报告', value: stats.totalArticles, color: 'text-brand' },
                  { label: '今日新增', value: stats.todayArticles, color: 'text-emerald-600' },
                  { label: '覆盖板块', value: stats.sectorCount, color: 'text-blue-600' },
                  { label: 'AI买入评级', value: stats.ratingDistribution.buy, color: 'text-amber-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-bold num-highlight text-lg ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Date Picker */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">按日期筛选</h3>
            <div className="space-y-1">
              {dates.slice(0, 7).map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d === dateFilter ? '' : d)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                    d === dateFilter
                      ? 'bg-brand-light text-brand font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <AdSlot size="rectangle" label="侧边广告位" />
        </div>
      </div>
    </div>
  )
}
