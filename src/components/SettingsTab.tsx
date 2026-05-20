import { useState, useEffect, useRef } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { getSettings, updateSetting, batchUpdateSettings, type SettingItem } from '../api/settings'

interface SettingsTabProps {}

const SETTING_LABELS: Record<string, string> = {
  site_name: '站点名称',
  site_description: '站点描述',
  page_size: '每页数量',
  api_base_url: '后端 API 地址',
  fetch_limit: '人气榜抓取数量',
  schedule_time: '定时任务时间',
  auto_fetch_enabled: '自动采集启用',
  ai_model_name: 'AI 模型名称',
}

export default function SettingsTab(_props: SettingsTabProps) {
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const fetchedRef = useRef(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getSettings()
      setSettings(data)
      const f: Record<string, string> = {}
      data.forEach(s => { f[s.key] = s.value })
      setForm(f)
    } catch (e) {
      console.error(e)
      setSettings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await batchUpdateSettings(form)
      alert('保存成功')
      await load()
    } catch (e: any) {
      alert(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const renderField = (s: SettingItem) => {
    const val = form[s.key] ?? ''

    if (s.key === 'auto_fetch_enabled') {
      return (
        <div key={s.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">{SETTING_LABELS[s.key] || s.key}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.description || ''}</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, [s.key]: f[s.key] === 'true' ? 'false' : 'true' }))}
            className={`w-11 h-6 rounded-full transition-all relative ${val === 'true' ? 'bg-brand' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${val === 'true' ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>
      )
    }

    if (s.key === 'schedule_time') {
      return (
        <div key={s.key} className="p-4 bg-gray-50 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{SETTING_LABELS[s.key] || s.key}</label>
          <input
            type="time"
            value={val}
            onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">{s.description || ''}</p>
        </div>
      )
    }

    return (
      <div key={s.key} className="p-4 bg-gray-50 rounded-xl">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{SETTING_LABELS[s.key] || s.key}</label>
        <input
          value={val}
          onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <p className="text-xs text-gray-400 mt-1">{s.description || ''}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">系统设置</h2>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50"
        >
          {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
      <div className="space-y-3">
        {settings.map(renderField)}
      </div>
    </div>
  )
}
