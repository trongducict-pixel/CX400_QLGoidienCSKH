import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { History, Search, ShieldCheck, Clock, User, ArrowRight } from 'lucide-react';

interface ActivityLogViewProps {
  activityLogs: ActivityLog[];
}

export function ActivityLogView({ activityLogs }: ActivityLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = activityLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nhật ký thao tác hệ thống (Audit Log)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Toàn bộ thao tác tạo chiến dịch, phân công cán bộ và cập nhật cuộc gọi được lưu vết tự động
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bảo mật chuẩn Ngân hàng</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo hành động, tên cán bộ, khách hàng hoặc chi tiết..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Không tìm thấy nhật ký thao tác nào.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800 text-xs">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{log.target}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                {log.details && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {log.details}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>
                    Người thực hiện: <strong className="text-slate-800">{log.userName}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
