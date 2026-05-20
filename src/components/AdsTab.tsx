import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react'
import { getAdminAds, createAd, updateAd, deleteAd, toggleAd, type AdItem, type AdFormData } from '../api/ads'

export default function AdsTab() {
  const [ads, setAds] = useState<AdItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingAd, setEditingAd] = useState<AdItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<AdFormData>>({})
  const [formLoading, setFormLoading] = useState(false)

  const loadAds = async () => {
    try {
      setLoading(true)
      const data = await getAdminAds({ page })
      setAds(data.items || [])
      setTotalPages(data.total_pages || 1)
    } catch (e) {
      console.error(e)
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAds() }, [page])

  const handleSave = async () => {
    try {
      setFormLoading(true)
      if (editingAd) {
        await updateAd(editingAd.id, form)
      } else {
        await createAd(form as AdFormData)
      }
      setShowModal(false)
      setEditingAd(null)
      setForm({})
      await loadAds()
    } catch (e: any) {
      alert(e.message || '保存失败')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAd(id)
      setDeleteConfirm(null)
      await loadAds()
    } catch {
      alert('删除失败')
    }
  }

  const handleToggle = async (id: number) => {
    try {
      setToggling(id)
      await toggleAd(id)
      await loadAds()
    } catch {
      alert('切换失败')
    } finally {
      setToggling(null)
    }
  }

  const openCreate = () => {
    setEditingAd(null)
    setForm({ slot_position: 'banner', ad_type: 'html', is_active: true })
    setShowModal(true)
  }

  const openEdit = (ad: AdItem) => {
    setEditingAd(ad)
    setForm({
      name: ad.name,
      slot_position: ad.slot_position,
      ad_type: ad.ad_type,
      html_code: ad.html_code,
      image_url: ad.image_url,
      link_url: ad.link_url,
      alt_text: ad.alt_text,
      is_active: ad.is_active,
      start_date: ad.start_date,
      end_date: ad.end_date,
    })
    setShowModal(true)
  }

  const slotLabels: Record<string, string> = { banner: 'Banner 横幅', rectangle: 'Rectangle 矩形', leaderboard: 'Leaderboard 页首' }
  const typeLabels: Record<string, string> = {
    html: '自定义 HTML',
    image: '图片广告',
    baidu: '百度联盟',
    google: '谷歌 Adsense',
    tencent: '腾讯广点通',
    taobao: '淘宝客',
  }

  const typeHelps: Record<string, { desc: string; template?: string }> = {
    html: { desc: '粘贴任意 HTML / JS 广告代码', template: '' },
    image: { desc: '填写图片 URL 和点击链接', template: '' },
    baidu: {
      desc: '粘贴百度联盟广告代码。格式示例：<script>var cpro_id = "xxxx";</script><script src="https://cpro.baidustatic.com/cpro/ui/cm.js"></script>',
      template: '<script type="text/javascript">\n  var cpro_id = "请填写您的百度联盟ID";\n</script>\n<script src="https://cpro.baidustatic.com/cpro/ui/cm.js"></script>',
    },
    google: {
      desc: '粘贴 Google Adsense 广告代码（包含 <ins class="adsbygoogle"> 的整段代码）',
      template: '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-请填写您的ID"\n  crossorigin="anonymous"></script>\n<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="ca-pub-请填写您的ID"\n  data-ad-slot="请填写广告位ID"\n  data-ad-format="auto"></ins>\n<script>\n  (adsbygoogle = window.adsbygoogle || []).push({});\n</script>',
    },
    tencent: {
      desc: '粘贴腾讯广点通广告代码',
      template: '<script>\n  /* 请填写您的腾讯广点通广告代码 */\n</script>',
    },
    taobao: {
      desc: '粘贴淘宝客推广代码，或填写淘宝客链接',
      template: '<a href="https://s.click.taobao.com/请填写您的推广链接" target="_blank" rel="noopener">\n  <img src="商品图片URL" alt="商品名称" />\n  <span>查看详情</span>\n</a>',
    },
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">广告管理</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-xs">
          <Plus className="w-4 h-4" /> 新建广告
        </button>
      </div>

      <div className="card overflow-hidden card-hover">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>位置</th>
                <th>类型</th>
                <th>状态</th>
                <th>起止时间</th>
                <th className="text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">加载中...</td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">暂无广告，点击「新建广告」添加</td></tr>
              ) : (
                ads.map(ad => (
                  <tr key={ad.id}>
                    <td className="font-medium text-gray-900">{ad.name}</td>
                    <td><span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">{slotLabels[ad.slot_position] || ad.slot_position}</span></td>
                    <td><span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-xs text-blue-600">{typeLabels[ad.ad_type] || ad.ad_type}</span></td>
                    <td>
                      <button onClick={() => handleToggle(ad.id)} disabled={toggling === ad.id}
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${ad.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {toggling === ad.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : ad.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {ad.is_active ? '启用' : '停用'}
                      </button>
                    </td>
                    <td className="text-xs text-gray-500 font-mono">
                      {ad.start_date ? String(ad.start_date).slice(0, 10) : '无'} ~ {ad.end_date ? String(ad.end_date).slice(0, 10) : '无'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(ad)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="编辑">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(ad.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" title="删除">
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
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-5">{editingAd ? '编辑广告' : '新建广告'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">广告名称</label>
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">展示位置</label>
                <select value={form.slot_position || 'banner'} onChange={e => setForm(f => ({ ...f, slot_position: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="banner">Banner（横幅）</option>
                  <option value="rectangle">Rectangle（矩形）</option>
                  <option value="leaderboard">Leaderboard（页首横幅）</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">广告类型</label>
                <select value={form.ad_type || 'html'} onChange={e => setForm(f => ({ ...f, ad_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="html">自定义 HTML / JS 代码</option>
                  <option value="image">图片广告</option>
                  <option value="baidu">百度联盟广告</option>
                  <option value="google">谷歌 Adsense 广告</option>
                  <option value="tencent">腾讯广点通广告</option>
                  <option value="taobao">淘宝客广告</option>
                </select>
                {form.ad_type && typeHelps[form.ad_type] && (
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{typeHelps[form.ad_type].desc}</p>
                )}
                {form.ad_type && typeHelps[form.ad_type]?.template && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, html_code: typeHelps[form.ad_type!].template }))}
                    className="mt-1.5 text-xs text-brand hover:underline"
                  >填入代码模板（需替换ID）</button>
                )}
              </div>
              {form.ad_type === 'image' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">图片 URL</label>
                  <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <p className="text-xs text-gray-400 mt-1">可填写完整 URL，或将图片上传至 backend/static/ads/ 目录后填写相对路径</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {form.ad_type === 'baidu' ? '百度联盟广告代码' : form.ad_type === 'google' ? 'Google Adsense 广告代码' : form.ad_type === 'tencent' ? '腾讯广点通广告代码' : form.ad_type === 'taobao' ? '淘宝客广告代码' : 'HTML / JS 代码'}
                  </label>
                  <textarea value={form.html_code || ''} onChange={e => setForm(f => ({ ...f, html_code: e.target.value }))}
                    rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">点击链接（可选）</label>
                <input value={form.link_url || ''} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">替代文本（可选）</label>
                <input value={form.alt_text || ''} onChange={e => setForm(f => ({ ...f, alt_text: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">开始日期（可选）</label>
                  <input type="date" value={(form.start_date as string) || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">结束日期（可选）</label>
                  <input type="date" value={(form.end_date as string) || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-brand" />
                <span className="text-sm text-gray-700">立即启用</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => { setShowModal(false); setEditingAd(null); setForm({}) }} className="btn-secondary">取消</button>
              <button onClick={handleSave} disabled={formLoading}
                className="btn-primary text-xs disabled:opacity-50">
                {formLoading ? '保存中...' : (editingAd ? '保存修改' : '创建广告')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-scale-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900">确认删除</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">确定要删除该广告吗？此操作不可撤销。</p>
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
