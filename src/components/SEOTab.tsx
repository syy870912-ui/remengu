import { useState, useEffect, useRef } from 'react'
import { Save, RotateCw } from 'lucide-react'
import { getSEOSettings, updateSEOSetting, type SEOSettingItem, type SEOUpdateData } from '../api/seo'

interface SEOTabProps {}

const PAGE_LABELS: Record<string, string> = {
  home: '首页',
  sector_list: '板块列表',
  sector_detail: '板块详情',
  article_list: '文章列表',
  article_detail: '文章详情',
}

export default function SEOTab(_props: SEOTabProps) {
  const [items, setItems] = useState<SEOSettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, SEOUpdateData>>({})
  const fetchedRef = useRef(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getSEOSettings()
      setItems(data)
      const f: Record<string, SEOUpdateData> = {}
      data.forEach(it => {
        f[it.page_type] = {
          meta_title: it.meta_title || '',
          meta_description: it.meta_description || '',
          meta_keywords: it.meta_keywords || '',
        }
      })
      setForm(f)
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    load()
  }, [])

  const handleSave = async (pageType: string) => {
    try {
      setSaving(pageType)
      await updateSEOSetting(pageType, form[pageType])
      await load()
    } catch (e: any) {
      alert(e.message || '保存失败')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0, 1, 2].map(i => (
          <div key={i} className="card p-5 h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="font-bold text-gray-900 text-sm">SEO 管理</h2>
      {items.map(it => (
        <div key={it.page_type} className="card p-5 card-hover">
          <h3 className="font-semibold text-gray-700 mb-3">
            {PAGE_LABELS[it.page_type] || it.page_type}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meta Title</label>
              <input
                value={form[it.page_type]?.meta_title || ''}
                onChange={e => {
                  setForm(f => {
                    const updated = { ...f };
                    if (!updated[it.page_type]) updated[it.page_type] = {};
                    updated[it.page_type] = { ...updated[it.page_type], meta_title: e.target.value };
                    return updated;
                  });
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meta Description</label>
              <textarea
                value={form[it.page_type]?.meta_description || ''}
                onChange={e => {
                  setForm(f => {
                    const updated = { ...f };
                    if (!updated[it.page_type]) updated[it.page_type] = {};
                    updated[it.page_type] = { ...updated[it.page_type], meta_description: e.target.value };
                    return updated;
                  });
                }}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meta Keywords</label>
              <input
                value={form[it.page_type]?.meta_keywords || ''}
                onChange={e => {
                  setForm(f => {
                    const updated = { ...f };
                    if (!updated[it.page_type]) updated[it.page_type] = {};
                    updated[it.page_type] = { ...updated[it.page_type], meta_keywords: e.target.value };
                    return updated;
                  });
                }}
                placeholder="逗号分隔"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleSave(it.page_type)}
                disabled={saving === it.page_type}
                className="btn-primary text-xs disabled:opacity-50 flex items-center gap-2"
              >
                {saving === it.page_type ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving === it.page_type ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
