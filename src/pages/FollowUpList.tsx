import React, { useState } from 'react';
import { User, Campaign, Customer, Assignment, CallRecord } from '../types';
import { db } from '../services/storage';
import {
  Bell,
  Calendar,
  Clock,
  Phone,
  Search,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface FollowUpListProps {
  currentUser: User;
  campaigns: Campaign[];
  customers: Customer[];
  assignments: Assignment[];
  callRecords: CallRecord[];
  staffUsers: User[];
  onCallCustomer: (customerId: string, campaignId: string) => void;
  onDataUpdated: () => void;
}

export function FollowUpList({
  currentUser,
  campaigns,
  customers,
  assignments,
  callRecords,
  staffUsers,
  onCallCustomer,
  onDataUpdated,
}: FollowUpListProps) {
  const isAdmin = currentUser.role === 'admin';
  const todayStr = new Date().toISOString().slice(0, 10);

  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');

  // Customer map
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  // Campaign map
  const campaignMap = new Map<string, Campaign>();
  campaigns.forEach((c) => campaignMap.set(c.id, c));

  // Assignment map: customerId -> staffId
  const assignmentMap = new Map<string, string>();
  assignments.forEach((a) => assignmentMap.set(a.customerId, a.staffId));

  // Staff map
  const staffMap = new Map<string, User>();
  staffUsers.forEach((s) => staffMap.set(s.id, s));

  // Filter records that have followUpDate or result === 'callback_requested'
  const callbackRecords = callRecords.filter((rec) => {
    const isCallback = rec.result === 'callback_requested' || !!rec.followUpDate;
    if (!isCallback) return false;

    // Security for staff: Only their assigned customers
    if (!isAdmin && rec.staffId !== currentUser.id) {
      return false;
    }
    return true;
  });

  // Filter by search & time
  const filteredRecords = callbackRecords.filter((rec) => {
    const cust = customerMap.get(rec.customerId);
    if (!cust) return false;

    // Search
    const matchesSearch =
      cust.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm.trim()) ||
      (rec.note || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Time filter
    if (timeFilter === 'today') {
      return rec.followUpDate === todayStr;
    }
    if (timeFilter === 'upcoming') {
      return rec.followUpDate && rec.followUpDate > todayStr;
    }
    if (timeFilter === 'overdue') {
      return rec.followUpDate && rec.followUpDate < todayStr;
    }

    return true;
  });

  // Sort by followUpDate ascending
  filteredRecords.sort((a, b) => {
    const dateA = `${a.followUpDate || '9999'} ${a.followUpTime || '23:59'}`;
    const dateB = `${b.followUpDate || '9999'} ${b.followUpTime || '23:59'}`;
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Danh sách khách hàng cần gọi lại
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isAdmin
                  ? 'Theo dõi toàn bộ lịch hẹn gọi lại của các cán bộ trong chi nhánh'
                  : 'Lịch hẹn gọi lại của các khách hàng được phân công cho bạn'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl">
          Tổng số lịch hẹn: {callbackRecords.length} khách hàng
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên KH, số điện thoại hoặc nội dung ghi chú..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'today', label: 'Hôm nay' },
            { id: 'upcoming', label: 'Sắp tới' },
            { id: 'overdue', label: 'Quá hạn' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                timeFilter === tab.id
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List for Callbacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Không có lịch hẹn gọi lại nào theo điều kiện lọc.
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const cust = customerMap.get(rec.customerId);
            const cmp = campaignMap.get(rec.campaignId);
            const staff = staffMap.get(rec.staffId);
            if (!cust) return null;

            const isOverdue = rec.followUpDate && rec.followUpDate < todayStr;
            const isToday = rec.followUpDate === todayStr;

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOverdue
                    ? 'bg-rose-50/40 border-rose-200'
                    : isToday
                    ? 'bg-purple-50/50 border-purple-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">{cust.fullName}</span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white uppercase">
                          Hôm nay
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase">
                          Quá hạn
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-mono font-bold text-[#003B70] mt-0.5">
                      📞 {cust.phone}
                    </div>
                  </div>

                  <a
                    href={`tel:${cust.phone}`}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>Gọi</span>
                  </a>
                </div>

                {/* Due Date Info */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-purple-900 font-bold">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>
                      Hẹn gọi: {rec.followUpTime || 'Trong ngày'} ngày {rec.followUpDate || 'Chưa định ngày'}
                    </span>
                  </div>
                  {staff && (
                    <span className="text-slate-500 text-[11px]">
                      CB: <strong className="text-slate-700">{staff.fullName}</strong>
                    </span>
                  )}
                </div>

                {/* Note */}
                {rec.note && (
                  <div className="mt-2 p-2.5 bg-white/80 rounded-xl text-xs text-slate-700 italic border border-slate-100">
                    "{rec.note}"
                  </div>
                )}

                {/* Campaign Tag & Action */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px]">Chiến dịch: {cmp?.name}</span>
                  <button
                    type="button"
                    onClick={() => onCallCustomer(cust.id, rec.campaignId)}
                    className="font-bold text-[#BE1E2D] hover:underline"
                  >
                    Cập nhật kết quả cuộc gọi →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
