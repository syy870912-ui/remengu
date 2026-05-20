import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layers, ChevronRight, TrendingUp, TrendingDown, Flame, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'
import { getSectors } from '../api/sectors'
import type { SectorStatsItem } from '../api/sectors'
import { getStocks } from '../api/stocks'
import type { StockItem } from '../api/stocks'
import { getArticles } from '../api/articles'
import type { ArticleItem } from '../api/articles'
import { changeColor, formatPercent } from '../utils/format'
import { ChangeBadge, SectorTag, RatingBadge } from '../components/Badges'
import AdSlot from '../components/AdSlot'

export default function SectorPage() {
  const [searchParams] = useSearchParams()
  const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') || '')

  const [sectorStats, setSectorStats] = useState<SectorStatsItem[]>([])
  const [sectorStocks, setSectorStocks] = useState<StockItem[]>([])
  const [sectorArticles, setSectorArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load sector stats on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getSectors()
        if (!cancelled) setSectorStats(data)
      } catch (e) {
        if (!cancelled) setError('板块数据加载失败')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Load stocks & articles when selectedSector changes
  useEffect(() => {
    if (!selectedSector) {
      setSectorStocks([])
      setSectorArticles([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      getStocks({ sector: selectedSector, page_size: 100 }),
      getArticles({ sector: selectedSector, page_size: 20 }),
    ])
      .then(([stocksRes, articlesRes]) => {
        if (!cancelled) {
          setSectorStocks(stocksRes.items)
          setSectorArticles(articlesRes.items)
        }
      })
      .catch(() => {
        if (!cancelled) setError('板块详情加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedSector])

  const risers = sectorStats.filter(s => s.avgChange > 0).sort((a, b) => b.avgChange - a.avgChange).slice(0, 3)
  const fallers = sectorStats.filter(s => s.avgChange < 0).sort((a, b) => a.avgChange - b.avgChange).slice(0, 3)
  const selectedStats = sectorStats.find(s => s.sector === selectedSector)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-purple w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">板块分析</h1>
          <p className="text-sm text-gray-400">{sectorStats.length}大热门板块 · 涨跌一目了然</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Top movers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <ArrowUp className="w-4 h-4 text-rise" /> 今日领涨板块
          </h3>
          <div className="space-y-2">
            {loading && sectorStats.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-gray-200 animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))
            ) : (
              risers.map((s, i) => (
                <button key={s.sector} onClick={() => setSelectedSector(s.sector)}
                  className="w-full flex items-center justify-between group hover:bg-red-50 px-4 py-3 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md text-xs font-bold text-white flex items-center justify-center ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : 'rank-3'}`}>{i + 1}</span>
                    <span className="text-sm text-gray-700 group-hover:text-rise font-semibold">{s.sector}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{s.count}只</span>
                    <span className="text-sm font-bold text-rise tabular-nums num-highlight">{formatPercent(s.avgChange)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <ArrowDown className="w-4 h-4 text-fall" /> 今日领跌板块
          </h3>
          <div className="space-y-2">
            {loading && sectorStats.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-gray-200 animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))
            ) : (
              fallers.map((s, i) => (
                <button key={s.sector} onClick={() => setSelectedSector(s.sector)}
                  className="w-full flex items-center justify-between group hover:bg-green-50 px-4 py-3 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md text-xs font-bold text-white flex items-center justify-center ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : 'rank-3'}`}>{i + 1}</span>
                    <span className="text-sm text-gray-700 group-hover:text-fall font-semibold">{s.sector}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{s.count}只</span>
                    <span className="text-sm font-bold text-fall tabular-nums num-highlight">{formatPercent(s.avgChange)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Sector List */}
        <div className="w-56 shrink-0">
          <div className="card overflow-hidden card-hover">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">所有板块</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {loading && sectorStats.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))
              ) : (
                sectorStats.map(s => (
                  <button
                    key={s.sector}
                    onClick={() => setSelectedSector(s.sector === selectedSector ? '' : s.sector)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                      s.sector === selectedSector ? 'bg-brand-light' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${s.sector === selectedSector ? 'text-brand' : 'text-gray-700'}`}>{s.sector}</p>
                      <p className="text-[11px] text-gray-400">{s.count} 只股票</p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums num-highlight ${changeColor(s.avgChange)}`}>{formatPercent(s.avgChange)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Sector Detail */}
        <div className="flex-1 min-w-0">
          {!selectedSector ? (
            <div className="card p-16 text-center">
              <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">点击左侧板块查看详细信息</p>
              <p className="text-xs text-gray-300 mt-1">选择板块后将显示个股列表和分析报告</p>
            </div>
          ) : loading ? (
            <div className="space-y-5 animate-fade-in">
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                      <div className="h-7 w-10 bg-gray-200 rounded animate-pulse mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-gray-50">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* Sector Header */}
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <SectorTag sector={selectedSector} className="text-sm px-3 py-1" />
                  <h2 className="text-lg font-bold text-gray-900">{selectedSector}板块</h2>
                  <span className={`text-lg font-bold tabular-nums num-highlight ${changeColor(selectedStats?.avgChange || 0)}`}>
                    {formatPercent(selectedStats?.avgChange || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '板块股票数', value: sectorStocks.length, gradient: 'from-blue-500/10 to-cyan-500/10' },
                    { label: '已生成报告', value: sectorArticles.length, gradient: 'from-red-500/10 to-rose-500/10' },
                    { label: '上涨家数', value: sectorStocks.filter(s => s.changePercent != null && s.changePercent > 0).length, gradient: 'from-emerald-500/10 to-green-500/10' },
                  ].map(({ label, value, gradient }) => (
                    <div key={label} className={`text-center p-4 bg-gradient-to-br ${gradient} rounded-xl border border-gray-100`}>
                      <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
                      <p className="text-2xl font-bold num-highlight text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stocks */}
              <div className="card overflow-hidden card-hover">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 font-semibold text-sm text-gray-700">
                  {selectedSector}板块个股列表
                </div>
                <div className="divide-y divide-gray-50">
                  {sectorStocks.map(stock => (
                    <div key={stock.code} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stock.name}</p>
                          <p className="text-xs font-mono text-gray-400">{stock.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums num-highlight text-gray-900">{stock.price != null ? stock.price.toFixed(2) : '-'}</p>
                          <ChangeBadge change={stock.changePercent ?? 0} />
                        </div>
                        {stock.hasArticle && (
                          <Link to={`/article/${stock.code}`} className="text-xs text-brand hover:text-brand-dark font-semibold flex items-center gap-0.5">
                            报告 <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Articles */}
              {sectorArticles.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">{selectedSector}板块分析报告</h3>
                  <div className="space-y-2">
                    {sectorArticles.slice(0, 6).map(art => (
                      <Link key={art.id} to={`/article/${art.stockCode}`} className="flex items-center gap-3 group p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <RatingBadge rating={art.rating} />
                        <span className="font-mono text-xs text-gray-400 shrink-0 bg-gray-50 px-2 py-0.5 rounded">{art.stockCode}</span>
                        <span className="text-sm text-gray-700 group-hover:text-brand flex-1 font-medium transition-colors">{art.stockName}</span>
                        <span className="text-xs text-gray-400 shrink-0">{art.createdAt}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand shrink-0 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
