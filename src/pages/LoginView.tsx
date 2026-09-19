import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/storage';
import { VietinBankLogo } from '../components/VietinBankLogo';
import { Lock, User as UserIcon, Shield, ArrowRight, Building2, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const user = db.getUserByUsername(username.trim());
      if (!user) {
        setError('Tên đăng nhập không tồn tại trong hệ thống.');
        setLoading(false);
        return;
      }

      if (user.password && user.password !== password) {
        setError('Mật khẩu không chính xác.');
        setLoading(false);
        return;
      }

      db.setCurrentUser(user);
      onLoginSuccess(user);
      setLoading(false);
    }, 200);
  };

  const handleQuickFill = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('123456');
    setError(null);
    const user = db.getUserByUsername(demoUsername);
    if (user) {
      db.setCurrentUser(user);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-red-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Unit Branding Header */}
        <div className="flex justify-center mb-3">
          <VietinBankLogo size="lg" />
        </div>

        <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900">
          CX400 – NHẮC LỊCH GỌI ĐIỆN CSKH
        </h2>

        <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-bold">
          <Building2 className="w-3.5 h-3.5 text-[#BE1E2D]" />
          <span>VietinBank Chi nhánh Ninh Bình – Phòng Dịch vụ khách hàng</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 rounded-2xl">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin hoặc cb01, cb02..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu (mặc định: 123456)"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#BE1E2D] hover:bg-[#a61825] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BE1E2D] transition-colors"
              >
                {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Test Accounts Box as explicitly requested in Section V */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Tài khoản mẫu để kiểm thử nhanh:
            </div>

            <div className="space-y-2">
              <div className="bg-red-50/80 p-2.5 rounded-xl border border-red-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-700" />
                    <span>Lãnh đạo Phòng DVKH</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Username: <code className="font-mono font-bold text-slate-800">admin</code> | Mật khẩu: <code className="font-mono">123456</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="px-2.5 py-1.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Đăng nhập ngay
                </button>
              </div>

              <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>Cán bộ CSKH (cb01 - Nguyễn Văn A)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Username: <code className="font-mono font-bold text-slate-800">cb01</code> | Mật khẩu: <code className="font-mono">123456</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cb01')}
                  className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Đăng nhập ngay
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 justify-center pt-1">
                <span>Cán bộ khác:</span>
                {['cb02', 'cb03', 'cb04', 'cb05'].map((cb) => (
                  <button
                    key={cb}
                    type="button"
                    onClick={() => handleQuickFill(cb)}
                    className="font-mono font-bold text-blue-700 hover:underline px-1"
                  >
                    {cb}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
