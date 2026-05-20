import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      await login(username, password);
      navigate("/admin", { replace: true });
    } catch {
      // error is set by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="gradient-brand w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">股析AI 管理后台</h1>
          <p className="text-gray-400 text-sm mt-1">请登录以继续访问</p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                             transition-all bg-gray-50/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                             transition-all bg-gray-50/50"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60
                         flex items-center gap-2"
            >
              {submitting ? "登录中..." : "登录"}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Default Credentials Hint */}
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">默认账号：</span>
              admin / admin123
            </p>
            <p className="text-xs text-amber-600 mt-1">
              首次登录后请立即修改密码
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-brand transition-colors inline-flex items-center gap-1"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
