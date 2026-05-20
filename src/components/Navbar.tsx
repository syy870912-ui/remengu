import { Link, useLocation, useNavigate } from 'react-router-dom'
import { TrendingUp, BarChart2, FileText, Layers, Settings, LogIn, LogOut, User, Bell, Menu, X, Activity } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const baseNavItems = [
  { label: '首页', path: '/', icon: TrendingUp },
  { label: '文章列表', path: '/articles', icon: FileText },
  { label: '板块分析', path: '/sectors', icon: Layers },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const navItems = isAuthenticated
    ? [...baseNavItems, { label: '后台管理', path: '/admin', icon: Settings }]
    : baseNavItems

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="glass border-b border-white/40 sticky top-0 z-50 shadow-sm shadow-gray-200/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="gradient-brand w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-base tracking-tight leading-none">
              股析<span className="text-brand">AI</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium leading-none mt-0.5 hidden sm:block">智能股票分析平台</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 rounded-xl p-1">
          {navItems.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(path)
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Data Source Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-medium text-emerald-700">东方财富人气榜</span>
            <span className="text-emerald-500">· 每日18:00更新</span>
          </div>

          {/* Auth Buttons */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-brand-light border border-brand/20 px-3 py-1.5 rounded-full">
                <User className="w-3 h-3 text-brand" />
                <span className="font-medium text-brand">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                title="退出登录"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-xs font-medium text-brand bg-brand-light border border-brand/20
                         px-3 py-1.5 rounded-full hover:bg-brand hover:text-white transition-colors"
            >
              <LogIn className="w-3 h-3" />
              <span className="hidden sm:inline">登录</span>
            </button>
          )}

          {/* Notification */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white"></span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-brand-light text-brand'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-emerald-600 bg-emerald-50 rounded-xl mt-2">
              <Activity className="w-4 h-4" />
              <span>数据来源：东方财富人气榜 · 每日收盘后自动更新</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
