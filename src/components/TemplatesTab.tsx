import { useState, useEffect } from 'react'
import { ToggleLeft, ToggleRight, GripVertical, RotateCw } from 'lucide-react'
import { getTemplates, toggleTemplate, reorderTemplates, type TemplateItem } from '../api/templates'

interface TemplatesTabProps {}

export default function TemplatesTab(_props: TemplatesTabProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getTemplates()
      setTemplates(data)
    } catch (e) {
      console.error(e)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id: number) => {
    try {
      setToggling(id)
      await toggleTemplate(id)
      await load()
    } catch {
      alert('切换失败')
    } finally {
      setToggling(null)
    }
  }

  const moveUp = async (idx: number) => {
    if (idx === 0) return
    const next = [...templates]
    ;[next[idx], next[idx - 1]] = [next[idx - 1], next[idx]]
    setTemplates(next)
  }

  const moveDown = async (idx: number) => {
    if (idx === templates.length - 1) return
    const next = [...templates]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setTemplates(next)
  }

  const saveOrder = async () => {
    try {
      setSavingOrder(true)
      await reorderTemplates(templates.map(t => t.id))
      alert('排序已保存')
    } catch {
      alert('保存失败')
    } finally {
      setSavingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">分析模板管理</h2>
        <button onClick={saveOrder} disabled={savingOrder}
          className="btn-primary text-xs disabled:opacity-50 flex items-center gap-2">
          {savingOrder ? <RotateCw className="w-4 h-4 animate-spin" /> : null}
          {savingOrder ? '保存中...' : '保存排序'}
        </button>
      </div>

      <div className="card overflow-hidden card-hover">
        <div className="divide-y divide-gray-50">
          {templates.map((t, idx) => (
            <div key={t.id} className="flex items-center gap-3 p-4">
              <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t.display_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.name}</p>
                {t.description ? (
                  <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors text-xs">
                  ↑
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === templates.length - 1}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors text-xs">
                  ↓
                </button>
                <button
                  onClick={() => handleToggle(t.id)}
                  disabled={toggling === t.id}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    t.is_enabled
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                  } disabled:opacity-50`}
                >
                  {toggling === t.id ? (
                    <RotateCw className="w-3 h-3 animate-spin" />
                  ) : t.is_enabled ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {t.is_enabled ? '已启用' : '已停用'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
