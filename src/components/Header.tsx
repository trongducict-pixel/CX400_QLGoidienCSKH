import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/storage';
import { VietinBankLogo } from './VietinBankLogo';
import {
  PhoneCall,
  UserCheck,
  LogOut,
  RotateCcw,
  Shield,
  User as UserIcon,
  ChevronDown,
  Building2,
  Bell,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User | null) => void;
  onResetData: () => void;
  callbackCount?: number;
}

export function Header({ currentUser, onUserChange, onResetData, callbackCount = 0 }: HeaderProps) {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const allUsers = db.getUsers();

  const handleSwitch = (user: User) => {
    db.setCurrentUser(user);
    onUserChange(user);
    setShowSwitchMenu(false);
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    onUserChange(null);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Brand Bar */}
      <div className="bg-[#BE1E2D] text-white text-xs px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <Building2 className="w-3.5 h-3.5" />
          <span>VietinBank Chi nhánh Ninh Bình – Phòng Dịch vụ khách hàng (DVKH)</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-red-100">
          <span>Hệ thống quản trị cuộc gọi CSKH nội bộ</span>
          <span>•</span>
          <span className="font-semibold text-white">Hotline HTKT: 1900 558 868</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <VietinBankLogo size="md" />
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-black bg-red-100 text-[#BE1E2D] tracking-wider">
                  CX400
                </span>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  NHẮC LỊCH GỌI ĐIỆN CSKH
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Quản lý & nhắc hẹn chiến dịch gọi điện chăm sóc khách hàng
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Callbacks badge notification */}
            {callbackCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
                title="Số khách hàng có lịch hẹn gọi lại"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span className="hidden sm:inline">Cần gọi lại:</span>
                <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[11px]">
                  {callbackCount}
                </span>
              </div>
            )}

            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                title="Chuyển đổi tài khoản demo để kiểm thử"
              >
                <div className="flex items-center gap-1.5">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <div className="text-left">
                    <span className="font-bold text-slate-800 block truncate max-w-[110px] sm:max-w-[150px]">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] font-normal text-slate-500 block">
                      {currentUser.role === 'admin' ? 'Lãnh đạo (Admin)' : `Cán bộ (${currentUser.username})`}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Switch Menu Dropdown */}
              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Chuyển đổi tài khoản demo
                  </div>

                  <div className="p-1 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400 px-2 pt-1">LÃNH ĐẠO:</div>
                    {allUsers
                      .filter((u) => u.role === 'admin')
                      .map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSwitch(u)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                            currentUser.id === u.id
                              ? 'bg-red-50 text-[#BE1E2D] font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400">Tài khoản: {u.username} • {u.title}</div>
                          </div>
                          {currentUser.id === u.id && (
                            <span className="w-2 h-2 rounded-full bg-[#BE1E2D]"></span>
                          )}
                        </button>
                      ))}

                    <div className="text-[11px] font-semibold text-slate-400 px-2 pt-2 border-t border-slate-100">
                      CÁN BỘ PHỤ TRÁCH GỌI ĐIỆN:
                    </div>
                    {allUsers
                      .filter((u) => u.role === 'staff')
                      .map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSwitch(u)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            currentUser.id === u.id
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400">Tài khoản: {u.username} • {u.title}</div>
                          </div>
                          {currentUser.id === u.id && (
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          )}
                        </button>
                      ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1 px-1">
                    <button
                      onClick={() => {
                        setShowSwitchMenu(false);
                        onResetData();
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Khôi phục dữ liệu mẫu ban đầu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
