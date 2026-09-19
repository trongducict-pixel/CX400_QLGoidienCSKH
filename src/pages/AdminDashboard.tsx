import React from 'react';
import { Campaign, Customer, CallRecord, User } from '../types';
import { computeCampaignStats } from '../services/statsService';
import { ProgressBar } from '../components/ProgressBar';
import { CampaignStatusBadge } from '../components/StatusBadge';
import {
  Megaphone,
  Users,
  PhoneCall,
  PhoneOff,
  Clock,
  Bell,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminDashboardProps {
  campaigns: Campaign[];
  customers: Customer[];
  callRecords: CallRecord[];
  staffUsers: User[];
  onCreateCampaign: () => void;
  onViewCampaignDetail: (campaignId: string) => void;
  onViewCallbacks: () => void;
}

export function AdminDashboard({
  campaigns,
  customers,
  callRecords,
  staffUsers,
  onCreateCampaign,
  onViewCampaignDetail,
  onViewCallbacks,
}: AdminDashboardProps) {
  // Compute overall stats across all campaigns
  const totalCampaigns = campaigns.length;
  const totalCustomers = customers.length;

  // Latest call status per customer
  const recordMap = new Map<string, CallRecord>();
  callRecords.forEach((r) => recordMap.set(r.customerId, r));

  let totalContacted = 0;
  let totalCannotContact = 0;
  let totalNotContacted = 0;
  let totalCallbacks = 0;

  customers.forEach((c) => {
    const rec = recordMap.get(c.id);
    const status = rec?.status || 'not_contacted';
    if (status === 'contacted') {
      totalContacted++;
      if (rec?.result === 'callback_requested' || rec?.followUpDate) {
        totalCallbacks++;
      }
    } else if (status === 'cannot_contact') {
      totalCannotContact++;
    } else {
      totalNotContacted++;
    }
  });

  const overallProgress = totalCustomers > 0
    ? Math.round(((totalContacted + totalCannotContact) / totalCustomers) * 100)
    : 0;

  // Active campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === 'in_progress');
  const expiredCampaigns = campaigns.filter(
    (c) => c.status === 'in_progress' && c.endDate < new Date().toISOString().slice(0, 10)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#BE1E2D] mb-1">
            BẢNG ĐIỀU KHIỂN TỔNG QUAN
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            CX400 – NHẮC LỊCH GỌI ĐIỆN CSKH
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            VietinBank Chi nhánh Ninh Bình • Phòng Dịch vụ khách hàng (DVKH)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateCampaign}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-sm font-bold shadow-md shadow-red-900/10 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ TẠO CHIẾN DỊCH</span>
          </button>
        </div>
      </div>

      {/* Warning for expired campaigns as specified in Section XXXI */}
      {expiredCampaigns.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-amber-900">
              ⚠ Cảnh báo: Có {expiredCampaigns.length} chiến dịch đã hết thời gian thực hiện nhưng vẫn đang ở trạng thái hoạt động:
            </span>
            <ul className="mt-1 list-disc list-inside text-amber-800 text-xs space-y-0.5">
              {expiredCampaigns.map((ec) => (
                <li key={ec.id} className="cursor-pointer hover:underline" onClick={() => onViewCampaignDetail(ec.id)}>
                  <strong>{ec.name}</strong> (Hạn chót: {ec.endDate})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Section VI: 6 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Tổng chiến dịch */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tổng chiến dịch</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCampaigns}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-bold text-blue-600">{activeCampaigns.length}</span> đang triển khai
          </div>
        </div>

        {/* 2. Tổng khách hàng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tổng khách hàng</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCustomers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Khách hàng được nhập</div>
        </div>

        {/* 3. Đã liên hệ */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold">Đã liên hệ</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">{totalContacted}</div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {totalCustomers > 0 ? Math.round((totalContacted / totalCustomers) * 100) : 0}% tổng danh sách
          </div>
        </div>

        {/* 4. Chưa liên hệ */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold">Chưa liên hệ</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">{totalNotContacted}</div>
          <div className="text-[11px] text-amber-600 mt-1">Cần cán bộ gọi điện</div>
        </div>

        {/* 5. Không liên hệ được */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 mb-2">
            <span className="text-xs font-bold">Không liên hệ được</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <PhoneOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700">{totalCannotContact}</div>
          <div className="text-[11px] text-rose-600 mt-1">Thuê bao/tắt máy/bận</div>
        </div>

        {/* 6. Cần gọi lại */}
        <div
          onClick={onViewCallbacks}
          className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center justify-between text-purple-800 mb-2">
            <span className="text-xs font-bold">Cần gọi lại</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700">{totalCallbacks}</div>
          <div className="text-[11px] text-purple-600 mt-1 font-semibold flex items-center gap-1">
            <span>Xem danh sách hẹn</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Overall Progress Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#BE1E2D]" />
            <span className="text-sm font-bold text-slate-800">
              Tiến độ gọi điện toàn bộ hệ thống
            </span>
          </div>
          <span className="text-sm font-extrabold text-[#BE1E2D]">
            {overallProgress}% hoàn thành ({totalContacted + totalCannotContact} / {totalCustomers} KH)
          </span>
        </div>
        <ProgressBar value={overallProgress} showText={false} size="md" />
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã liên hệ: {totalContacted}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Không liên hệ được: {totalCannotContact}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Chưa liên hệ: {totalNotContacted}
          </span>
        </div>
      </div>

      {/* Dashboard chiến dịch đang hoạt động (Bảng theo đặc tả Mục VI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chiến dịch đang hoạt động
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi tình hình thực hiện các chiến dịch chăm sóc khách hàng đang mở
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateCampaign}
            className="text-xs font-bold text-[#BE1E2D] hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Tạo thêm chiến dịch
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-5 py-3">Chiến dịch</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Tổng KH</th>
                <th className="px-4 py-3 text-right">Đã liên hệ</th>
                <th className="px-4 py-3 text-right">Chưa liên hệ</th>
                <th className="px-4 py-3 text-right">Không LH</th>
                <th className="px-4 py-3 text-right">Gọi lại</th>
                <th className="px-6 py-3">Tiến độ</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    Chưa có chiến dịch nào được tạo. Bấm "+ TẠO CHIẾN DỊCH" để bắt đầu.
                  </td>
                </tr>
              ) : (
                campaigns.map((cmp) => {
                  const cmpCustomers = customers.filter((c) => c.campaignId === cmp.id);
                  const stats = computeCampaignStats(cmp, cmpCustomers, callRecords);

                  return (
                    <tr
                      key={cmp.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewCampaignDetail(cmp.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-[#BE1E2D] transition-colors text-sm">
                          {cmp.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {cmp.script}
                        </div>
                        <div className="mt-1">
                          <CampaignStatusBadge status={cmp.status} />
                          {stats.isExpired && cmp.status === 'in_progress' && (
                            <span className="ml-1.5 inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              Hết hạn
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-slate-600 text-xs">
                        <div>{cmp.startDate}</div>
                        <div className="text-slate-400">đến {cmp.endDate}</div>
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {stats.totalCustomers}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {stats.contacted}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-amber-600 whitespace-nowrap">
                        {stats.notContacted}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        {stats.cannotContact}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-purple-600 whitespace-nowrap">
                        {stats.callbacks}
                      </td>

                      <td className="px-6 py-4 w-44">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                          <span>{stats.progressPercent}%</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {stats.contacted + stats.cannotContact}/{stats.totalCustomers}
                          </span>
                        </div>
                        <ProgressBar value={stats.progressPercent} showText={false} size="sm" />
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCampaignDetail(cmp.id);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#BE1E2D] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <span>Chi tiết</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
