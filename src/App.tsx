import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ArticleListPage from './pages/ArticleListPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import SectorPage from './pages/SectorPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-center page-enter">
      <div className="gradient-dark w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-gray-500/20">
        <span className="text-4xl font-bold text-white">404</span>
      </div>
      <p className="text-xl font-bold text-gray-700 mb-2">页面未找到</p>
      <p className="text-gray-400 mb-8">文章不存在或已被删除</p>
      <a href="/" className="btn-primary inline-flex items-center gap-2">
        返回首页
      </a>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="gradient-brand w-8 h-8 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">股析<span className="text-brand">AI</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI 驱动的股票深度分析平台，每日自动生成200只热门股票的专业分析报告。
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3">数据来源</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              本站数据来自东方财富股吧人气榜，每日收盘后自动采集更新。
              分析报告由AI模型基于多维度数据自动生成，仅供参考。
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3">免责声明</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              本站所有内容均由AI自动生成，仅供参考，不构成任何投资建议。
              股票市场存在风险，投资需谨慎。
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-400">
            股析AI · 股票分析报告自动生成系统 · 每日自动更新200只热门股票分析报告 · 数据来源：东方财富人气榜
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/articles" element={<ArticleListPage />} />
              <Route path="/article/:code" element={<ArticleDetailPage />} />
              <Route path="/sectors" element={<SectorPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
