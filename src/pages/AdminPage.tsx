import { useState, useEffect, useRef } from 'react'
import { Play, RefreshCw, Trash2, RotateCcw, CheckCircle, XCircle, Clock, AlertCircle, BarChart2, FileText, Activity, Calendar, Zap, ExternalLink, Settings, Database, Cpu, Flame, TrendingUp, ListOrdered, LayoutDashboard, Globe, Plus, Pencil, ToggleLeft, ToggleRight, Save, GripVertical, Lock, LogOut } from 'lucide-react'
import { getTasks, triggerTask, type TaskLogItem } from '../api/tasks'
import { getArticles, deleteArticle, regenerateArticle, type ArticleItem } from '../api/articles'
import { getStats, getSectors, type DashboardStats, type SectorStatsItem } from '../api/sectors'
import { getAdminAds, createAd, updateAd, deleteAd, toggleAd, type AdItem, type AdFormData } from '../api/ads'
import { RatingBadge, SectorTag } from '../components/Badges'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { changePasswordApi } from '../api/auth'
import AdsTab from '../components/AdsTab'
import StockAdminTab from '../components/StockAdminTab'
import SettingsTab from '../components/SettingsTab'
import TemplatesTab from '../components/TemplatesTab'
import SEOTab from '../components/SEOTab'

type Tab = 'ads' | 'task' | 'articles' | 'stats' | 'schedule' | 'stocks' | 'settings' | 'templates' | 'seo'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('task')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskRunning, setTaskRunning] = useState(false)
  const [triggerCount, setTriggerCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Change password modal
  const [pwModalOpen, setPwModalOpen] = useState(false)
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const { logout } = useAuth()

  const openPwModal = () => {
    setPwOld('')
    setPwNew('')
    setPwConfirm('')
    setPwError(null)
    setPwSuccess(false)
    setPwModalOpen(true)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)

    if (!pwOld || !pwNew || !pwConfirm) {
      setPwError('请填写所有字段')
      return
    }
    if (pwNew.length < 6) {
      setPwError('新密码长度至少6位')
      return
    }
    if (pwNew !== pwConfirm) {
      setPwError('两次输入的新密码不一致')
      return
    }

    setPwLoading(true)
    try {
      await changePasswordApi({ old_password: pwOld, new_password: pwNew })
      setPwSuccess(true)
      setTimeout(() => {
        setPwModalOpen(false)
        logout()
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '修改失败'
      setPwError(msg)
    } finally {
      setPwLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setError(null)
      const data = await getStats()
      setStats(data)
    } catch (err) {
      setError('加载统计数据失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const handleTrigger = async () => {
    if (taskRunning) {
      alert('任务正在执行中，请稍后再试')
      return
    }
    try {
      setError(null)
      const res = await triggerTask()
      if (!res.success) {
        alert(res.message || '触发任务失败')
        return
      }
      setTaskRunning(true)
      setTriggerCount(c => c + 1)

      pollingRef.current = setInterval(async () => {
        try {
          const { items } = await getTasks(1, 20)
          const latestTask = items.find(t => t.id === res.taskId)
          if (latestTask && (latestTask.status === 'success' || latestTask.status === 'failed')) {
            stopPolling()
            setTaskRunning(false)
            loadStats()
          }
        } catch {
          stopPolling()
          setTaskRunning(false)
        }
      }, 5000)
    } catch (err) {
      alert('触发任务失败')
      console.error(err)
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="gradient-dark w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-gray-500/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">后台管理系统</h1>
            <p className="text-sm text-gray-400">股析AI · 数据管理与任务监控</p>
          </div>
        </div>
      <div className="flex items-center gap-3">
          <button
            onClick={openPwModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-brand hover:bg-brand-light transition-all border border-gray-200 hover:border-brand/30"
          >
            <Lock className="w-4 h-4" />
            修改密码
          </button>
          <button
            onClick={handleTrigger}
            disabled={taskRunning}
            className={`btn-primary flex items-center gap-2 ${taskRunning ? '!bg-gray-200 !text-gray-400 !shadow-none !cursor-not-allowed' : ''}`}
          >
            {taskRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {taskRunning ? '任务执行中...' : '手动触发生成'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="card p-5 flex items-center gap-4 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-gray-200" />
                <div>
                  <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="col-span-4 card p-5 text-center text-red-500 text-sm">{error}</div>
        ) : (
          [
            { label: '累计生成文章', value: stats?.totalArticles ?? 0, icon: FileText, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
            { label: '今日生成', value: stats?.todayArticles ?? 0, icon: Calendar, gradient: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
            { label: '任务成功率', value: stats?.taskSuccessRate || '0%', icon: Activity, gradient: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-500/20' },
            { label: '覆盖板块数', value: stats?.sectorCount ?? 0, icon: BarChart2, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
          ].map(({ label, value, icon: Icon, gradient, shadow }) => (
            <div key={label} className="card p-5 card-hover flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-bold num-highlight text-gray-900">{value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Running banner */}
      {taskRunning && (
        <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center gap-3 text-sm text-blue-700 animate-scale-in">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">正在执行第 {triggerCount} 次生成任务</p>
            <p className="text-xs text-blue-500 mt-0.5">正在获取东方财富人气排行前200名股票，预计需要 3-5 分钟...</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 mb-5">
        {[
          { key: 'ads', label: '广告管理', icon: ListOrdered },
          { key: 'task', label: '任务管理', icon: Activity },
          { key: 'articles', label: '文章管理', icon: FileText },
          { key: 'stats', label: '数据统计', icon: BarChart2 },
          { key: 'schedule', label: '数据源', icon: Database },
          { key: 'stocks', label: '股票管理', icon: ListOrdered },
          { key: 'settings', label: '系统设置', icon: Settings },
          { key: 'templates', label: '模板管理', icon: LayoutDashboard },
          { key: 'seo', label: 'SEO 管理', icon: Globe },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-brand shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'ads' && <AdsTab />}
      {tab === 'task' && <TaskTab />}
      {tab === 'articles' && <ArticlesTab stats={stats} />}
      {tab === 'stats' && <StatsTab stats={stats} />}
      {tab === 'schedule' && <ScheduleTab />}
      {tab === 'stocks' && <StockAdminTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'seo' && <SEOTab />}

      {/* Change Password Modal */}
      {pwModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-scale-in" onClick={() => !pwLoading && setPwModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">修改密码</h3>
            </div>

            {pwSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">密码修改成功！</p>
                <p className="text-xs text-gray-400 mt-1">即将自动退出，请使用新密码重新登录</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {pwError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">当前密码</label>
                  <input
                    type="password"
                    value={pwOld}
                    onChange={e => setPwOld(e.target.value)}
                    placeholder="请输入当前密码"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                               transition-all bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">新密码</label>
                  <input
                    type="password"
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
                    placeholder="至少6位字符"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                               transition-all bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">确认新密码</label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="再次输入新密码"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                               transition-all bg-gray-50/50"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setPwModalOpen(false)}
                    disabled={pwLoading}
                    className="btn-secondary text-xs"
                  >取消</button>
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {pwLoading ? '提交中...' : '确认修改'}
                    {!pwLoading && <Lock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskTab() {
  const [tasks, setTasks] = useState<TaskLogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { items } = await getTasks(1, 20)
        setTasks(items)
      } catch {
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="card overflow-hidden card-hover">
      <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">任务执行记录</h2>
        <span className="text-xs text-gray-400">最近 {tasks.length} 次</span>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="data-table">
          <thead>
            <tr>
              <th>状态</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th className="text-right">生成数量</th>
              <th className="text-right">错误数</th>
              <th className="text-right">耗时</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">加载中...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">暂无任务记录</td>
              </tr>
            ) : (
              tasks.map(log => (
                <tr key={log.id}>
                  <td>
                    {log.status === 'running' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 执行中
                      </span>
                    ) : log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> 成功
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> 失败
                      </span>
                    )}
                  </td>
                  <td className="font-mono tabular-nums text-gray-600">{log.startTime}</td>
                  <td className="font-mono tabular-nums text-gray-600">
                    {log.status === 'running' ? <span className="text-blue-500 text-xs">进行中...</span> : log.endTime}
                  </td>
                  <td className="text-right">
                    <span className={`font-bold num-highlight ${log.articleCount >= 190 ? 'text-emerald-600' : 'text-amber-600'}`}>{log.articleCount}</span>
                  </td>
                  <td className="text-right">
                    <span className={`font-medium ${log.errorCount > 5 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{log.errorCount}</span>
                  </td>
                  <td className="text-right tabular-nums text-gray-600">{log.status === 'running' ? '-' : log.duration}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ArticlesTabProps {
  stats: DashboardStats | null
}

function ArticlesTab({ stats: _stats }: ArticlesTabProps) {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  const loadArticles = async () => {
    try {
      setLoading(true)
      const data = await getArticles({ page_size: 20 })
      setArticles(data.items || [])
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [currentPage])

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id)
      await deleteArticle(id)
      await loadArticles()
    } catch {
      alert('删除失败')
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const handleRegenerate = async (stockCode: string) => {
    try {
      setRegenerating(stockCode)
      await regenerateArticle(stockCode)
      await loadArticles()
    } catch {
      alert('重新生成失败')
    } finally {
      setRegenerating(null)
    }
  }

  return (
    <div className="card overflow-hidden card-hover">
      <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">已生成文章列表</h2>
        <span className="text-xs text-gray-400">共 {articles.length} 篇</span>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="data-table">
          <thead>
            <tr>
              <th>股票</th>
              <th>标题</th>
              <th className="hidden md:table-cell">板块</th>
              <th className="text-center">评级</th>
              <th className="text-center">时间</th>
              <th className="text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">加载中...</td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">暂无文章</td>
              </tr>
            ) : (
              articles.map(art => (
                <tr key={art.id}>
                  <td>
                    <p className="text-sm font-semibold text-gray-900">{art.stockName}</p>
                    <p className="text-xs font-mono text-gray-400">{art.stockCode}</p>
                  </td>
                  <td>
                    <Link to={`/article/${art.stockCode}`} className="text-sm text-gray-700 hover:text-brand transition-colors line-clamp-2">
                      {art.title}
                    </Link>
                  </td>
                  <td className="hidden md:table-cell">
                    <SectorTag sector={art.sector} />
                  </td>
                  <td className="text-center">
                    <RatingBadge rating={art.rating} />
                  </td>
                  <td className="text-center text-xs text-gray-500 tabular-nums">{art.createdAt}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1.5">
                      <Link to={`/article/${art.stockCode}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="查看">
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleRegenerate(art.stockCode)}
                        disabled={regenerating === art.stockCode}
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors disabled:opacity-50"
                        title="重新生成"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${regenerating === art.stockCode ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(art.id)}
                        disabled={deleting === art.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900">确认删除</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">确定要删除该篇分析报告吗？此操作不可撤销。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-primary text-xs">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatsTabProps {
  stats: DashboardStats | null
}

function StatsTab({ stats }: StatsTabProps) {
  const [tasks, setTasks] = useState<TaskLogItem[]>([])
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [sectorStats, setSectorStats] = useState<SectorStatsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, articleRes, sectorRes] = await Promise.all([
          getTasks(1, 20),
          getArticles({ page_size: 100 }),
          getSectors(),
        ])
        setTasks(taskRes.items)
        setArticles(articleRes.items || [])
        setSectorStats(sectorRes)
      } catch {
        setTasks([])
        setArticles([])
        setSectorStats([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sectorDist = sectorStats.map(s => ({
    ...s,
    articles: articles.filter(a => a.sector === s.sector).length,
  })).filter(s => s.articles > 0).sort((a, b) => b.articles - a.articles)

  const maxArticles = sectorDist.length > 0 ? Math.max(...sectorDist.map(s => s.articles)) : 1

  const ratingDist = stats?.ratingDistribution

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Trend */}
      <div className="card p-5 md:col-span-2">
        <h3 className="font-bold text-gray-900 text-sm mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand" />
          近7日生成趋势
        </h3>
        <div className="flex items-end gap-3 h-36">
          {tasks.slice(0, 7).reverse().map((log) => {
            const h = (log.articleCount / 200) * 100
            return (
              <div key={log.id} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500 tabular-nums font-medium">{log.articleCount}</span>
                <div
                  className={`w-full rounded-xl transition-all ${
                    log.status === 'success' ? 'gradient-rise' :
                    log.status === 'running' ? 'gradient-blue animate-pulse' : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(h, 8)}%` }}
                ></div>
                <span className="text-[11px] text-gray-400 w-full text-center">{log.startTime.split(' ')[0].slice(5)}</span>
              </div>
            )
          })}
          {tasks.length === 0 && (
            <div className="flex-1 text-center text-gray-400 text-sm py-8">暂无数据</div>
          )}
        </div>
      </div>

      {/* Sector Distribution */}
      <div className="card p-5 md:col-span-2">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-500" />
          板块文章数量分布
        </h3>
        <div className="space-y-3">
          {sectorDist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
          ) : (
            sectorDist.map(s => (
              <div key={s.sector} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16 shrink-0 font-medium">{s.sector}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-red-400 rounded-full transition-all"
                    style={{ width: `${(s.articles / maxArticles) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold num-highlight text-gray-700 w-8 text-right">{s.articles}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4">AI评级分布</h3>
        <div className="space-y-4">
          {[
            { rating: 'buy' as const, label: '买入', count: ratingDist?.buy ?? 0, color: 'bg-rise', lightColor: 'bg-red-100 text-rise' },
            { rating: 'hold' as const, label: '持有', count: ratingDist?.hold ?? 0, color: 'bg-amber-400', lightColor: 'bg-amber-100 text-amber-600' },
            { rating: 'sell' as const, label: '卖出', count: ratingDist?.sell ?? 0, color: 'bg-fall', lightColor: 'bg-green-100 text-fall' },
          ].map(({ label, count, color }) => {
            const total = (ratingDist?.buy ?? 0) + (ratingDist?.hold ?? 0) + (ratingDist?.sell ?? 0)
            const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0'
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8 shrink-0 font-semibold">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                </div>
                <span className="text-sm text-gray-700 num-highlight font-semibold">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Stats */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4">任务成功率统计</h3>
        <div className="space-y-3">
          {[
            { label: '成功', count: tasks.filter(l => l.status === 'success').length, color: 'text-emerald-600', icon: CheckCircle, bg: 'bg-emerald-50' },
            { label: '失败', count: tasks.filter(l => l.status === 'failed').length, color: 'text-red-600', icon: XCircle, bg: 'bg-red-50' },
            { label: '执行中', count: tasks.filter(l => l.status === 'running').length, color: 'text-blue-600', icon: Clock, bg: 'bg-blue-50' },
          ].map(({ label, count, color, icon: Icon, bg }) => (
            <div key={label} className={`flex items-center justify-between p-3 rounded-xl ${bg}`}>
              <span className={`flex items-center gap-2 text-sm font-medium ${color}`}>
                <Icon className="w-4 h-4" />{label}
              </span>
              <span className={`font-bold text-xl num-highlight ${color}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScheduleTab() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Data Source */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          数据源：东方财富人气榜
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          系统每日收盘后自动从东方财富股吧获取人气排行前200名热门股票数据，
          结合实时行情、财务数据、龙虎榜、资金流向等多维度信息，通过AI模型生成深度分析报告。
        </p>

        {/* Workflow */}
        <div className="bg-gray-50 rounded-2xl p-5">
          <h4 className="font-semibold text-sm text-gray-700 mb-4">自动执行流程</h4>
          <div className="space-y-3">
            {[
              { time: '15:30', step: '市场收盘', desc: 'A股市场收盘，数据开始稳定', icon: Clock, color: 'text-gray-500 bg-white' },
              { time: '15:35', step: '数据采集', desc: '抓取东方财富人气榜前200名股票', icon: Database, color: 'text-blue-500 bg-blue-50' },
              { time: '15:45', step: '行情同步', desc: '同步最新行情、财务、资金流向等数据', icon: Zap, color: 'text-amber-500 bg-amber-50' },
              { time: '16:00', step: 'AI分析', desc: '对每只股票执行12维度AI深度分析', icon: Cpu, color: 'text-purple-500 bg-purple-50' },
              { time: '17:00', step: '报告生成', desc: '生成结构化分析报告并入库', icon: FileText, color: 'text-emerald-500 bg-emerald-50' },
              { time: '18:00', step: '发布上线', desc: '报告审核通过后自动发布到前端', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
            ].map(({ time, step, desc, icon: Icon, color }) => (
              <div key={step} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{step}</span>
                    <span className="text-xs font-mono text-gray-400 bg-white px-2 py-0.5 rounded">{time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Config */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          定时任务配置
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">自动采集人气榜数据</p>
              <p className="text-xs text-gray-400 mt-0.5">每个交易日 15:35 自动执行</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              已启用
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">AI报告自动生成</p>
              <p className="text-xs text-gray-400 mt-0.5">数据采集完成后自动触发</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              已启用
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">报告自动发布</p>
              <p className="text-xs text-gray-400 mt-0.5">生成完成后自动审核发布</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              已启用
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">周末及节假日跳过</p>
              <p className="text-xs text-gray-400 mt-0.5">非交易日不执行采集任务</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              已启用
            </div>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-gray-400" />
          外部数据源链接
        </h3>
        <div className="space-y-2">
          <a href="https://guba.eastmoney.com/" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-700 group-hover:text-brand font-medium">东方财富股吧 · 人气榜</span>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" />
          </a>
          <a href="https://data.eastmoney.com/" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700 group-hover:text-brand font-medium">东方财富数据中心</span>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" />
          </a>
        </div>
      </div>
    </div>
  )
}
