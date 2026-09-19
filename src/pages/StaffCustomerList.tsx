import React, { useState } from 'react';
import { User, Campaign, Customer, Assignment, CallRecord, CallStatus } from '../types';
import { CallStatusBadge, CallResultBadge } from '../components/StatusBadge';
import {
  Search,
  Filter,
  Phone,
  Bell,
  CheckCircle2,
  Calendar,
  Users,
} from 'lucide-react';

interface StaffCustomerListProps {
  currentUser: User;
  campaigns: Campaign[];
  customers: Customer[];
  assignments: Assignment[];
  callRecords: CallRecord[];
  onCallCustomer: (customerId: string, campaignId: string) => void;
}

export function StaffCustomerList({
  currentUser,
  campaigns,
  customers,
  assignments,
  callRecords,
  onCallCustomer,
}: StaffCustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CallStatus | 'callback'>('all');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  // Filter assignments strictly for this staff member (Section III & XXIV security rule)
  const myAssignments = assignments.filter((a) => a.staffId === currentUser.id);
  const myCustomerIds = new Set(myAssignments.map((a) => a.customerId));
  const myCampaignIds = new Set(myAssignments.map((a) => a.campaignId));

  const myCampaigns = campaigns.filter((c) => myCampaignIds.has(c.id));

  // Map of call records
  const recordMap = new Map<string, CallRecord>();
  callRecords.forEach((r) => recordMap.set(r.customerId, r));

  // Filter customers assigned to this staff
  const filteredCustomers = customers.filter((cust) => {
    // Security check: Must be assigned to this staff
    if (!myCustomerIds.has(cust.id)) return false;

    // Campaign filter
    if (selectedCampaignId !== 'all' && cust.campaignId !== selectedCampaignId) {
      return false;
    }

    // Search filter
    const matchesSearch =
      cust.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm.trim());
    if (!matchesSearch) return false;

    // Status filter
    const record = recordMap.get(cust.id);
    const status = record?.status || 'not_contacted';

    if (statusFilter === 'callback') {
      return !!record?.followUpDate || record?.result === 'callback_requested';
    }

    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Danh sách khách hàng được phân công
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Xem toàn bộ khách hàng bạn được giao phụ trách gọi điện và chăm sóc
          </p>
        </div>

        <div className="text-xs bg-blue-50 text-blue-900 px-3 py-1.5 rounded-xl border border-blue-200 font-bold self-start sm:self-auto">
          Cán bộ: {currentUser.fullName} ({currentUser.username})
        </div>
      </div>

      {/* Filter and Search Bar (Section XVII) */}
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
            placeholder="Tìm tên hoặc số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
          />
        </div>

        {/* Campaign select & status tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Campaign Select */}
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Tất cả chiến dịch</option>
            {myCampaigns.map((cmp) => (
              <option key={cmp.id} value={cmp.id}>
                {cmp.name}
              </option>
            ))}
          </select>

          {/* Status Filter Buttons (Section XVII) */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'not_contacted', label: 'Chưa liên hệ' },
              { id: 'contacted', label: 'Đã liên hệ' },
              { id: 'cannot_contact', label: 'Không LH' },
              { id: 'callback', label: 'Cần gọi lại 🔔' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
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
      </div>

      {/* Customers Table (Section XVII) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-5 py-3.5">Họ tên</th>
                <th className="px-4 py-3.5">Số điện thoại</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Kết quả</th>
                <th className="px-4 py-3.5">Lịch gọi lại</th>
                <th className="px-4 py-3.5">Ghi chú</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy khách hàng nào theo điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const record = recordMap.get(cust.id);
                  const status = record?.status || 'not_contacted';

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 text-center text-slate-400 font-semibold">
                        {cust.stt || idx + 1}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {cust.fullName}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-800 whitespace-nowrap">
                        {cust.phone}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <CallStatusBadge status={status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {record?.result ? (
                          <CallResultBadge result={record.result} />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {record?.followUpDate ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            <Bell className="w-3 h-3 text-purple-600" />
                            {record.followUpTime || ''} {record.followUpDate}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs truncate text-slate-600">
                        {record?.note || <span className="text-slate-400">-</span>}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onCallCustomer(cust.id, cust.campaignId)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi ngay</span>
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
