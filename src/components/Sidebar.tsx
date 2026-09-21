import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  PhoneCall,
  Bell,
  FileText,
  History,
  CheckCircle2,
  UserCog,
  FileSpreadsheet,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'campaigns'
  | 'customers'
  | 'staff_call'
  | 'callbacks'
  | 'reports'
  | 'logs'
  | 'users';

interface SidebarProps {
  currentUser: User;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  callbackCount: number;
}

export function Sidebar({
  currentUser,
  activeTab,
  onSelectTab,
  callbackCount,
}: SidebarProps) {
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const isStaff = currentUser.role === 'staff';

  // Navigation items for Admin (Toàn quyền)
  const adminNav = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'campaigns' as ActiveTab,
      label: 'Chiến dịch',
      icon: Megaphone,
    },
    {
      id: 'customers' as ActiveTab,
      label: 'Khách hàng',
      icon: Users,
    },
    {
      id: 'callbacks' as ActiveTab,
      label: 'Lịch gọi lại',
      icon: Bell,
      badge: callbackCount,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Báo cáo & Xuất Excel',
      icon: FileText,
    },
    {
      id: 'users' as ActiveTab,
      label: 'Quản trị người dùng',
      icon: UserCog,
    },
    {
      id: 'logs' as ActiveTab,
      label: 'Lịch sử thao tác',
      icon: History,
    },
  ];

  // Navigation items for Trưởng/Phó phòng (Chỉ quản lý chiến dịch, xem báo cáo, không quản trị người dùng)
  const managerNav = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tổng quan chi nhánh',
      icon: LayoutDashboard,
    },
    {
      id: 'campaigns' as ActiveTab,
      label: 'Quản lý chiến dịch',
      icon: Megaphone,
    },
    {
      id: 'customers' as ActiveTab,
      label: 'Danh sách khách hàng',
      icon: Users,
    },
    {
      id: 'callbacks' as ActiveTab,
      label: 'Lịch hẹn gọi lại',
      icon: Bell,
      badge: callbackCount,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Báo cáo & Xuất Excel',
      icon: FileText,
    },
    {
      id: 'logs' as ActiveTab,
      label: 'Lịch sử thao tác',
      icon: History,
    },
  ];

  // Navigation items for Nhân viên (Tiếp nhận & thực hiện cuộc gọi)
  const staffNav = [
    {
      id: 'staff_call' as ActiveTab,
      label: 'Gọi điện CSKH',
      icon: PhoneCall,
      highlight: true,
    },
    {
      id: 'customers' as ActiveTab,
      label: 'KH được phân công',
      icon: Users,
    },
    {
      id: 'callbacks' as ActiveTab,
      label: 'Lịch hẹn gọi lại',
      icon: Bell,
      badge: callbackCount,
    },
    {
      id: 'campaigns' as ActiveTab,
      label: 'Chiến dịch tham gia',
      icon: Megaphone,
    },
  ];

  let currentNav = staffNav;
  if (isAdmin) currentNav = adminNav;
  else if (isManager) currentNav = managerNav;

  const getRoleBadge = () => {
    if (isAdmin) {
      return {
        roleGroup: 'Nhóm quyền: Admin',
        tag: 'Toàn quyền',
        tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    }
    if (isManager) {
      return {
        roleGroup: 'Nhóm quyền: Trưởng/Phó phòng',
        tag: 'Lãnh đạo phòng',
        tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    }
    return {
      roleGroup: 'Nhóm quyền: Nhân viên',
      tag: 'Cán bộ CSKH',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  };

  const roleInfo = getRoleBadge();

  return (
    <>
      {/* Desktop Sidebar (hidden on small mobile) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4">
        {/* Role identifier badge */}
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {roleInfo.roleGroup}
          </div>
          <div className="text-sm font-bold text-slate-800 flex items-center justify-between mt-0.5">
            <span className="truncate mr-2">{currentUser.fullName}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${roleInfo.tagColor}`}>
              {roleInfo.tag}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{currentUser.title}</div>
        </div>

        {/* Menu Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Chức Năng
          </div>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#BE1E2D] text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-white text-[#BE1E2D]'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Operational Guidelines Footer Note */}
        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs text-slate-600">
            <div className="font-bold text-[#BE1E2D] flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nghiệp vụ CSKH VietinBank
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Thực hiện đúng quy chuẩn chào hỏi, truyền đạt chính xác kịch bản và cập nhật kết quả trung thực.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {currentNav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#BE1E2D] font-bold' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[65px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
