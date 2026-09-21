import React, { useState } from 'react';
import { Campaign, Customer, Assignment, CallRecord, User, ActivityLog, CallStatus, CallResult } from '../types';
import { computeCampaignStats, computeStaffProgress } from '../services/statsService';
import { exportCampaignToExcel, ExportReportItem } from '../services/excelService';
import { db } from '../services/storage';
import { ProgressBar } from '../components/ProgressBar';
import { CallStatusBadge, CallResultBadge, CampaignStatusBadge } from '../components/StatusBadge';
import { EditCampaignModal } from './EditCampaignModal';
import {
  ArrowLeft,
  Calendar,
  Users,
  PhoneCall,
  PhoneOff,
  Clock,
  Bell,
  Download,
  Search,
  Filter,
  AlertTriangle,
  History,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';

interface CampaignDetailViewProps {
  campaignId: string;
  campaigns: Campaign[];
  customers: Customer[];
  assignments: Assignment[];
  callRecords: CallRecord[];
  staffUsers: User[];
  activityLogs: ActivityLog[];
  currentUser?: User;
  onBack: () => void;
  onUpdateCampaignStatus?: (status: Campaign['status']) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  onCampaignUpdated?: () => void;
}

export function CampaignDetailView({
  campaignId,
  campaigns,
  customers,
  assignments,
  callRecords,
  staffUsers,
  activityLogs,
  currentUser,
  onBack,
  onUpdateCampaignStatus,
  onDeleteCampaign,
  onCampaignUpdated,
}: CampaignDetailViewProps) {
  const campaign = campaigns.find((c) => c.id === campaignId);

  // Filters for customer table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CallStatus>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [hasFollowUpOnly, setHasFollowUpOnly] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'customers' | 'staff' | 'logs'>('customers');

  // Edit & Delete modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'staff' | 'uncontacted'>('all');
  const [exportStaffId, setExportStaffId] = useState<string>(staffUsers[0]?.id || '');

  if (!campaign) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">Chiến dịch không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Filter customers for this campaign
  const campaignCustomers = customers.filter((c) => c.campaignId === campaign.id);
  const campaignAssignments = assignments.filter((a) => a.campaignId === campaign.id);
  const campaignRecords = callRecords.filter((r) => r.campaignId === campaign.id);

  // Helper maps
  const recordMap = new Map<string, CallRecord>();
  campaignRecords.forEach((r) => recordMap.set(r.customerId, r));

  const assignmentMap = new Map<string, string>(); // customerId -> staffId
  campaignAssignments.forEach((a) => assignmentMap.set(a.customerId, a.staffId));

  const staffMap = new Map<string, User>();
  staffUsers.forEach((s) => staffMap.set(s.id, s));

  // Compute Overall Stats
  const stats = computeCampaignStats(campaign, campaignCustomers, campaignRecords);
  const staffProgressStats = computeStaffProgress(
    campaign.id,
    staffUsers,
    campaignCustomers,
    campaignAssignments,
    campaignRecords
  );

  // Filter Customers
  const filteredCustomers = campaignCustomers.filter((cust) => {
    const record = recordMap.get(cust.id);
    const assignedStaffId = assignmentMap.get(cust.id) || '';

    // Search filter (name or phone)
    const matchesSearch =
      cust.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm.trim());

    // Staff filter
    const matchesStaff = selectedStaffFilter === 'all' || assignedStaffId === selectedStaffFilter;

    // Status filter
    const status = record?.status || 'not_contacted';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    // Result filter
    const result = record?.result || '';
    const matchesResult = resultFilter === 'all' || result === resultFilter;

    // Follow-up only
    const matchesFollowUp = !hasFollowUpOnly || !!record?.followUpDate;

    return matchesSearch && matchesStaff && matchesStatus && matchesResult && matchesFollowUp;
  });

  // Filter Activity Logs for this campaign
  const campaignLogs = activityLogs.filter(
    (log) =>
      log.target === campaign.name ||
      campaignCustomers.some((c) => c.fullName === log.target)
  );

  // Handle Export Excel Action (Section XXII)
  const handleExport = () => {
    let targetCustomers = campaignCustomers;

    if (exportScope === 'uncontacted') {
      targetCustomers = campaignCustomers.filter((c) => {
        const r = recordMap.get(c.id);
        return !r || r.status === 'not_contacted';
      });
    } else if (exportScope === 'staff') {
      targetCustomers = campaignCustomers.filter((c) => assignmentMap.get(c.id) === exportStaffId);
    }

    const reportItems: ExportReportItem[] = targetCustomers.map((cust, idx) => {
      const record = recordMap.get(cust.id);
      const staffId = assignmentMap.get(cust.id);
      const staff = staffId ? staffMap.get(staffId) : undefined;

      let statusText = 'Chưa liên hệ';
      if (record?.status === 'contacted') statusText = 'Đã liên hệ';
      if (record?.status === 'cannot_contact') statusText = 'Không liên hệ được';

      const resultMap: Record<string, string> = {
        announced: 'Đã thông báo',
        interested: 'Khách hàng quan tâm',
        callback_requested: 'Khách hàng đề nghị gọi lại',
        not_interested: 'Khách hàng không có nhu cầu',
        other: 'Khác',
      };
      const resultText = record?.result ? resultMap[record.result] || record.result : '';

      const callDateTime = record?.callTime ? record.callTime.split(' ') : ['', ''];

      return {
        stt: cust.stt || idx + 1,
        fullName: cust.fullName,
        phone: cust.phone,
        staffName: staff?.fullName || 'Chưa phân công',
        statusText,
        resultText,
        callDate: callDateTime[0] || '',
        callTime: callDateTime[1] || '',
        followUpDate: record?.followUpDate || '',
        followUpTime: record?.followUpTime || '',
        note: record?.note || '',
      };
    });

    const prefix =
      exportScope === 'uncontacted'
        ? 'Bao_Cao_Chua_Lien_He'
        : exportScope === 'staff'
        ? `Bao_Cao_Can_Bo_${staffMap.get(exportStaffId)?.username || 'CB'}`
        : 'Bao_Cao_Toan_Bo_Chien_Dich';

    exportCampaignToExcel(campaign.name, reportItems, prefix);
    setShowExportModal(false);
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const handleDeleteCampaign = () => {
    setIsDeleting(true);
    try {
      db.deleteCampaign(campaign.id, currentUser);
      setIsDeleteConfirmOpen(false);
      if (onDeleteCampaign) {
        onDeleteCampaign(campaign.id);
      } else {
        onBack();
      }
    } catch (err: any) {
      alert('Lỗi khi xóa chiến dịch: ' + (err.message || err));
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#BE1E2D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách chiến dịch</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
                title="Lãnh đạo phòng / Quản trị viên chỉnh sửa thông tin chiến dịch"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-700" />
                <span>Chỉnh sửa</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                title="Lãnh đạo phòng / Quản trị viên xóa chiến dịch"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>📥 XUẤT EXCEL</span>
          </button>

          {onUpdateCampaignStatus && campaign.status === 'in_progress' && (
            <button
              type="button"
              onClick={() => onUpdateCampaignStatus('completed')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Đánh dấu hoàn thành
            </button>
          )}
        </div>
      </div>

      {/* Campaign Details Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                CHI TIẾT CHIẾN DỊCH
              </span>
              <CampaignStatusBadge status={campaign.status} />
              {stats.isExpired && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  ⚠ Hết hạn thực hiện
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {campaign.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Thời gian: {campaign.startDate} đến {campaign.endDate}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Tiến độ hoàn thành</div>
            <div className="text-3xl font-black text-[#BE1E2D]">{stats.progressPercent}%</div>
            <div className="text-[11px] text-slate-500">
              {stats.contacted + stats.cannotContact} / {stats.totalCustomers} KH
            </div>
          </div>
        </div>

        {/* Warning if expired as required in Section XXXI */}
        {stats.isExpired && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>⚠ Chiến dịch đã hết thời gian thực hiện (Hạn chót: {campaign.endDate}). Dữ liệu vẫn được bảo lưu để xem và xuất báo cáo.</span>
          </div>
        )}

        {/* Call Script Box */}
        <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl">
          <div className="text-xs font-bold text-[#BE1E2D] uppercase tracking-wide mb-1">
            Nội dung kịch bản cần trao đổi tới khách hàng:
          </div>
          <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed">
            "{campaign.script}"
          </p>
        </div>

        {/* Section XVIII: Overview stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-2xl font-black text-slate-900">{stats.totalCustomers}</div>
            <div className="text-xs font-medium text-slate-500">Tổng KH</div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <div className="text-2xl font-black text-emerald-700">{stats.contacted}</div>
            <div className="text-xs font-bold text-emerald-800">Đã liên hệ</div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="text-2xl font-black text-amber-700">{stats.notContacted}</div>
            <div className="text-xs font-bold text-amber-800">Chưa liên hệ</div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <div className="text-2xl font-black text-rose-700">{stats.cannotContact}</div>
            <div className="text-xs font-bold text-rose-800">Không liên hệ được</div>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <div className="text-2xl font-black text-purple-700">{stats.callbacks}</div>
            <div className="text-xs font-bold text-purple-800">Cần gọi lại</div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <div className="text-2xl font-black text-blue-700">{stats.progressPercent}%</div>
            <div className="text-xs font-bold text-blue-800">Tiến độ</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <ProgressBar value={stats.progressPercent} showText={false} size="md" />
        </div>
      </div>

      {/* Tabs: Theo dõi cán bộ, Danh sách khách hàng, Lịch sử thao tác */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'customers'
              ? 'bg-[#BE1E2D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Danh sách khách hàng ({campaignCustomers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'staff'
              ? 'bg-[#BE1E2D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tiến độ từng cán bộ ({staffUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'logs'
              ? 'bg-[#BE1E2D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Lịch sử thao tác ({campaignLogs.length})
        </button>
      </div>

      {/* TAB 1: CUSTOMERS TABLE (Section XX) */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo họ tên hoặc số điện thoại..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Filter by Staff */}
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-red-500"
              >
                <option value="all">Tất cả cán bộ</option>
                {staffUsers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.username})
                  </option>
                ))}
              </select>

              {/* Filter by Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-red-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="not_contacted">🟡 Chưa liên hệ</option>
                <option value="contacted">🟢 Đã liên hệ</option>
                <option value="cannot_contact">🔴 Không liên hệ được</option>
              </select>

              {/* Filter by Result */}
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-red-500"
              >
                <option value="all">Tất cả kết quả</option>
                <option value="announced">Đã thông báo</option>
                <option value="interested">Khách hàng quan tâm</option>
                <option value="callback_requested">Đề nghị gọi lại</option>
                <option value="not_interested">Không có nhu cầu</option>
                <option value="other">Khác</option>
              </select>

              {/* Checkbox Callbacks */}
              <label className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={hasFollowUpOnly}
                  onChange={(e) => setHasFollowUpOnly(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Có lịch gọi lại</span>
              </label>
            </div>
          </div>

          {/* Customers Table (Section XX) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">STT</th>
                    <th className="px-5 py-3.5">Họ và tên</th>
                    <th className="px-4 py-3.5">Số điện thoại</th>
                    <th className="px-4 py-3.5">Cán bộ phụ trách</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Kết quả</th>
                    <th className="px-4 py-3.5">Gọi lại / Ghi chú</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Thời gian gọi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                        Không có khách hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => {
                      const record = recordMap.get(cust.id);
                      const staffId = assignmentMap.get(cust.id);
                      const staff = staffId ? staffMap.get(staffId) : undefined;
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
                            {staff ? (
                              <div>
                                <span className="font-semibold text-slate-800">{staff.fullName}</span>
                                <span className="text-[10px] text-slate-400 block">{staff.username}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa phân công</span>
                            )}
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

                          <td className="px-4 py-3.5 max-w-xs">
                            {record?.followUpDate && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[11px] mb-1">
                                <Bell className="w-3 h-3 text-purple-600" />
                                {record.followUpTime || ''} {record.followUpDate}
                              </div>
                            )}
                            {record?.note && (
                              <div className="text-[11px] text-slate-600 line-clamp-1 italic">
                                "{record.note}"
                              </div>
                            )}
                            {!record?.followUpDate && !record?.note && (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                            {record?.callTime || '-'}
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
      )}

      {/* TAB 2: STAFF PROGRESS (Section XIX) */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tiến độ thực hiện của từng cán bộ
              </h3>
              <p className="text-xs text-slate-500">
                Bấm vào tên cán bộ để chuyển nhanh sang xem danh sách khách hàng của cán bộ đó
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Cán bộ</th>
                  <th className="px-4 py-3.5 text-right">Được giao</th>
                  <th className="px-4 py-3.5 text-right">Đã liên hệ</th>
                  <th className="px-4 py-3.5 text-right">Chưa liên hệ</th>
                  <th className="px-4 py-3.5 text-right">Không LH</th>
                  <th className="px-4 py-3.5 text-right">Gọi lại</th>
                  <th className="px-6 py-3.5 w-48">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {staffProgressStats.map((item) => (
                  <tr
                    key={item.staff.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedStaffFilter(item.staff.id);
                      setActiveTab('customers');
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#BE1E2D] flex items-center gap-1.5 text-sm">
                        <span>{item.staff.fullName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.staff.username} • {item.staff.title}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm">
                      {item.assignedCount}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-emerald-600 text-sm">
                      {item.contactedCount}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-amber-600 text-sm">
                      {item.notContactedCount}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-rose-600 text-sm">
                      {item.cannotContactCount}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-purple-600 text-sm">
                      {item.callbackCount}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span>{item.progressPercent}%</span>
                        <span className="text-[10px] text-slate-400">
                          {item.contactedCount + item.cannotContactCount}/{item.assignedCount}
                        </span>
                      </div>
                      <ProgressBar value={item.progressPercent} showText={false} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY LOGS (Section XXI) */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Nhật ký lịch sử thao tác & cập nhật cuộc gọi
            </h3>
            <p className="text-xs text-slate-500">
              Toàn bộ lịch sử cập nhật trạng thái của cán bộ đối với khách hàng (Bảo mật - không cho phép xóa)
            </p>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {campaignLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có thao tác cập nhật nào được ghi lại cho chiến dịch này.
              </div>
            ) : (
              campaignLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {log.action}
                      </span>
                      <span>{log.target}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                  </div>

                  <div className="mt-1 text-slate-700 font-medium">{log.details}</div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    Người thực hiện: <strong className="text-slate-600">{log.userName}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EXCEL EXPORT MODAL (Section XXII) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">XUẤT BÁO CÁO EXCEL</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-600">
                Chọn phạm vi dữ liệu cần xuất báo cáo cho chiến dịch{' '}
                <strong className="text-slate-900">"{campaign.name}"</strong>:
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-slate-800">Xuất toàn bộ chiến dịch</div>
                    <div className="text-[11px] text-slate-500">
                      Tất cả {campaignCustomers.length} khách hàng kèm trạng thái, kết quả và lịch hẹn
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'uncontacted'}
                    onChange={() => setExportScope('uncontacted')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-slate-800">Xuất danh sách chưa liên hệ</div>
                    <div className="text-[11px] text-slate-500">
                      Chỉ xuất {stats.notContacted} khách hàng chưa được gọi để đôn đốc
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={exportScope === 'staff'}
                    onChange={() => setExportScope('staff')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">Xuất danh sách theo cán bộ</div>
                    <div className="text-[11px] text-slate-500 mb-2">
                      Chỉ xuất các khách hàng được giao cho một cán bộ cụ thể
                    </div>
                    {exportScope === 'staff' && (
                      <select
                        value={exportStaffId}
                        onChange={(e) => setExportStaffId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      >
                        {staffUsers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.username})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>TẢI FILE EXCEL (.XLSX)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CAMPAIGN MODAL */}
      {isEditModalOpen && currentUser && (
        <EditCampaignModal
          campaign={campaign}
          currentUser={currentUser}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setIsEditModalOpen(false);
            if (onCampaignUpdated) {
              onCampaignUpdated();
            }
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Xác nhận xóa chiến dịch
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hành động này dành cho Quản trị viên và Lãnh đạo phòng DVKH
                </p>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Cảnh báo dữ liệu quan trọng:</span>
                </div>
                <p>
                  Bạn đang chuẩn bị xóa chiến dịch <strong>"{campaign.name}"</strong>.
                </p>
                <p>
                  Toàn bộ danh sách <strong>{campaignCustomers.length} khách hàng</strong> và <strong>{campaignRecords.length} lịch sử cuộc gọi</strong> liên quan sẽ bị xóa hoàn toàn khỏi hệ thống.
                </p>
                <p className="font-bold text-rose-700">Thao tác này không thể hoàn tác!</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteCampaign}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/10 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Đang xóa...' : 'Đồng ý xóa chiến dịch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
