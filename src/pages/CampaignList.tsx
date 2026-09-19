import React, { useState } from 'react';
import { Campaign, Customer, CallRecord, CampaignStatus } from '../types';
import { computeCampaignStats } from '../services/statsService';
import { CampaignStatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import {
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  Users,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface CampaignListProps {
  campaigns: Campaign[];
  customers: Customer[];
  callRecords: CallRecord[];
  isAdmin: boolean;
  onCreateCampaign: () => void;
  onViewCampaignDetail: (campaignId: string) => void;
}

export function CampaignList({
  campaigns,
  customers,
  callRecords,
  isAdmin,
  onCreateCampaign,
  onViewCampaignDetail,
}: CampaignListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((cmp) => {
    const matchesSearch =
      cmp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.script.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cmp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Danh sách chiến dịch CSKH
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Quản lý toàn bộ các chiến dịch gọi điện chăm sóc khách hàng của Chi nhánh Ninh Bình
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onCreateCampaign}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-sm font-bold shadow-md shadow-red-900/10 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ TẠO CHIẾN DỊCH</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên chiến dịch hoặc nội dung trao đổi..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'in_progress', label: 'Đang thực hiện' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'draft', label: 'Bản nháp' },
            { id: 'closed', label: 'Đã đóng' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-5 py-3.5">Tên chiến dịch & Nội dung</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Thời gian</th>
                <th className="px-3 py-3.5 text-right">Tổng KH</th>
                <th className="px-3 py-3.5 text-right">Đã LH</th>
                <th className="px-3 py-3.5 text-right">Chưa LH</th>
                <th className="px-3 py-3.5 text-right">Không LH</th>
                <th className="px-3 py-3.5 text-right">Gọi lại</th>
                <th className="px-5 py-3.5 w-36">Tiến độ</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy chiến dịch nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((cmp, index) => {
                  const cmpCustomers = customers.filter((c) => c.campaignId === cmp.id);
                  const stats = computeCampaignStats(cmp, cmpCustomers, callRecords);

                  return (
                    <tr
                      key={cmp.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onViewCampaignDetail(cmp.id)}
                    >
                      <td className="px-4 py-4 text-center text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 min-w-[240px]">
                        <div className="font-bold text-slate-900 group-hover:text-[#BE1E2D] transition-colors text-sm">
                          {cmp.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 max-w-md">
                          {cmp.script || cmp.description}
                        </div>
                        {stats.isExpired && cmp.status === 'in_progress' && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Đã hết hạn thực hiện ({cmp.endDate})
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-slate-600 text-xs">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {cmp.startDate}
                        </div>
                        <div className="text-slate-400 text-[11px] pl-4">đến {cmp.endDate}</div>
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {stats.totalCustomers}
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {stats.contacted}
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-amber-600 whitespace-nowrap">
                        {stats.notContacted}
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        {stats.cannotContact}
                      </td>

                      <td className="px-3 py-4 text-right font-bold text-purple-600 whitespace-nowrap">
                        {stats.callbacks}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                          <span>{stats.progressPercent}%</span>
                          <span className="text-[10px] text-slate-400">
                            {stats.contacted + stats.cannotContact}/{stats.totalCustomers}
                          </span>
                        </div>
                        <ProgressBar value={stats.progressPercent} showText={false} size="sm" />
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <CampaignStatusBadge status={cmp.status} />
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
                          <span>Xem</span>
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
