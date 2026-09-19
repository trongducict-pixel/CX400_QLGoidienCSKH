import React, { useState, useEffect } from 'react';
import { User, Campaign, Customer, Assignment, CallRecord, CallStatus, CallResult } from '../types';
import { db } from '../services/storage';
import { ProgressBar } from '../components/ProgressBar';
import { CallStatusBadge, CallResultBadge } from '../components/StatusBadge';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface StaffCallingViewProps {
  currentUser: User;
  campaigns: Campaign[];
  customers: Customer[];
  assignments: Assignment[];
  callRecords: CallRecord[];
  onDataUpdated: () => void;
  onViewCallbacks: () => void;
}

export function StaffCallingView({
  currentUser,
  campaigns,
  customers,
  assignments,
  callRecords,
  onDataUpdated,
  onViewCallbacks,
}: StaffCallingViewProps) {
  // Find active campaigns assigned to this staff
  const staffAssignments = assignments.filter((a) => a.staffId === currentUser.id);
  const assignedCampaignIds = Array.from(new Set(staffAssignments.map((a) => a.campaignId)));
  const availableCampaigns = campaigns.filter(
    (c) => assignedCampaignIds.includes(c.id) && c.status === 'in_progress'
  );

  // Selected Campaign ID (default to first active or first available)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    availableCampaigns[0]?.id || campaigns[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedCampaignId && availableCampaigns.length > 0) {
      setSelectedCampaignId(availableCampaigns[0].id);
    }
  }, [availableCampaigns, selectedCampaignId]);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Customers assigned to this staff in this campaign
  const assignedCustomerIds = staffAssignments
    .filter((a) => a.campaignId === selectedCampaignId)
    .map((a) => a.customerId);

  const myCustomers = customers.filter((c) => assignedCustomerIds.includes(c.id));

  // Map of customer records
  const recordMap = new Map<string, CallRecord>();
  callRecords
    .filter((r) => r.campaignId === selectedCampaignId)
    .forEach((r) => recordMap.set(r.customerId, r));

  // Statistics for this staff
  let contactedCount = 0;
  let cannotContactCount = 0;
  let notContactedCount = 0;
  let callbackCount = 0;

  myCustomers.forEach((c) => {
    const rec = recordMap.get(c.id);
    const status = rec?.status || 'not_contacted';
    if (status === 'contacted') {
      contactedCount++;
      if (rec?.result === 'callback_requested' || rec?.followUpDate) {
        callbackCount++;
      }
    } else if (status === 'cannot_contact') {
      cannotContactCount++;
    } else {
      notContactedCount++;
    }
  });

  const totalAssigned = myCustomers.length;
  const completedCount = contactedCount + cannotContactCount;
  const progressPercent = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  // Active Calling Mode state
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);

  // Form states for the currently selected customer
  const currentCustomer = myCustomers[currentCustomerIndex];
  const currentRecord = currentCustomer ? recordMap.get(currentCustomer.id) : undefined;

  const [callStatus, setCallStatus] = useState<CallStatus>('not_contacted');
  const [callResult, setCallResult] = useState<CallResult | undefined>(undefined);
  const [callNote, setCallNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('09:00');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync form when customer changes
  useEffect(() => {
    if (currentRecord) {
      setCallStatus(currentRecord.status);
      setCallResult(currentRecord.result);
      setCallNote(currentRecord.note || '');
      setFollowUpDate(currentRecord.followUpDate || '');
      setFollowUpTime(currentRecord.followUpTime || '09:00');
    } else {
      setCallStatus('not_contacted');
      setCallResult(undefined);
      setCallNote('');
      setFollowUpDate('');
      setFollowUpTime('09:00');
    }
    setSaveSuccessNotice(null);
  }, [currentCustomerIndex, currentCustomer?.id, currentRecord]);

  // Jump to next uncontacted customer automatically
  const findNextUncontactedIndex = (startIndex: number = 0) => {
    for (let i = startIndex + 1; i < myCustomers.length; i++) {
      const rec = recordMap.get(myCustomers[i].id);
      if (!rec || rec.status === 'not_contacted') {
        return i;
      }
    }
    // Loop from 0 to startIndex
    for (let i = 0; i <= startIndex; i++) {
      const rec = recordMap.get(myCustomers[i].id);
      if (!rec || rec.status === 'not_contacted') {
        return i;
      }
    }
    return startIndex < myCustomers.length - 1 ? startIndex + 1 : 0;
  };

  // Start calling from the first uncontacted customer
  const handleStartCalling = () => {
    const firstUncontacted = myCustomers.findIndex((c) => {
      const rec = recordMap.get(c.id);
      return !rec || rec.status === 'not_contacted';
    });
    setCurrentCustomerIndex(firstUncontacted >= 0 ? firstUncontacted : 0);
    setIsCallingActive(true);
  };

  // Section XVI: Save & Next Customer
  const handleSaveAndNext = () => {
    if (!currentCustomer || !activeCampaign) return;

    if (callStatus === 'not_contacted') {
      alert('Vui lòng chọn kết quả cuộc gọi: "ĐÃ LIÊN HỆ" hoặc "KHÔNG LIÊN HỆ ĐƯỢC".');
      return;
    }

    if (callStatus === 'contacted' && !callResult) {
      alert('Vui lòng chọn kết quả chi tiết của cuộc gọi (Ví dụ: Đã thông báo, Quan tâm, Đề nghị gọi lại...).');
      return;
    }

    if (callResult === 'callback_requested' && !followUpDate) {
      alert('Khách hàng đề nghị gọi lại, vui lòng chọn Ngày gọi lại.');
      return;
    }

    // Save to Database
    db.saveCallRecord(
      {
        campaignId: activeCampaign.id,
        customerId: currentCustomer.id,
        staffId: currentUser.id,
        status: callStatus,
        result: callStatus === 'contacted' ? callResult : undefined,
        note: callNote.trim() || undefined,
        followUpDate: callResult === 'callback_requested' ? followUpDate : undefined,
        followUpTime: callResult === 'callback_requested' ? followUpTime : undefined,
      },
      currentUser,
      currentCustomer.fullName
    );

    onDataUpdated();

    setSaveSuccessNotice(`Đã lưu thông tin của KH ${currentCustomer.fullName}`);

    // Auto-advance to next customer as mandated in Section XVI
    setTimeout(() => {
      const nextIdx = findNextUncontactedIndex(currentCustomerIndex);
      setCurrentCustomerIndex(nextIdx);
    }, 300);
  };

  if (!activeCampaign) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Chưa có chiến dịch nào được giao</h3>
        <p className="text-xs text-slate-500 mt-1">
          Lãnh đạo Phòng DVKH chưa phân công khách hàng trong chiến dịch nào cho bạn. Vui lòng liên hệ lãnh đạo để được giao việc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* SECTION XI: Staff Welcome & Campaign Selector */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400">Phòng DVKH VietinBank Ninh Bình</div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Xin chào, {currentUser.fullName}
            </h1>
            <div className="text-xs text-slate-500 mt-0.5">
              Mã cán bộ: <code className="font-bold text-slate-800">{currentUser.username}</code> • {currentUser.title}
            </div>
          </div>

          {/* Campaign Selector if multiple */}
          <div className="shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Chọn chiến dịch:
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value);
                setIsCallingActive(false);
                setCurrentCustomerIndex(0);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#BE1E2D] focus:outline-none"
            >
              {campaigns.map((cmp) => (
                <option key={cmp.id} value={cmp.id}>
                  {cmp.name} ({cmp.status === 'in_progress' ? 'Đang chạy' : cmp.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section XI: Progress & Counters */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2 font-bold">
            <span className="text-slate-800">
              Công việc hôm nay • Bạn được giao: <span className="text-[#BE1E2D]">{totalAssigned} khách hàng</span>
            </span>
            <span className="text-[#BE1E2D]">
              Tiến độ: {completedCount} / {totalAssigned} ({progressPercent}%)
            </span>
          </div>

          <ProgressBar value={progressPercent} showText={false} size="md" />

          {/* 4 Summary Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs font-semibold">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-xs text-emerald-800 block">🟢 Đã liên hệ</span>
              <span className="text-xl font-black text-emerald-700">{contactedCount}</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <span className="text-xs text-amber-800 block">🟡 Chưa liên hệ</span>
              <span className="text-xl font-black text-amber-700">{notContactedCount}</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-xs text-rose-800 block">🔴 Không liên hệ được</span>
              <span className="text-xl font-black text-rose-700">{cannotContactCount}</span>
            </div>

            <div
              onClick={onViewCallbacks}
              className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              <span className="text-xs text-purple-800 block">🔔 Cần gọi lại</span>
              <span className="text-xl font-black text-purple-700">{callbackCount}</span>
            </div>
          </div>

          {/* Section XI: Big "BẮT ĐẦU GỌI" button */}
          {!isCallingActive && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleStartCalling}
                className="w-full sm:w-auto px-8 py-4 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-2xl text-base font-black shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-3 mx-auto active:scale-98"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>▶ BẮT ĐẦU GỌI ({notContactedCount} KH CHƯA GỌI)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION XII, XIII, XIV, XV, XVI: DEDICATED CALLING SCREEN */}
      {isCallingActive && currentCustomer && (
        <div className="bg-white rounded-2xl border-2 border-[#BE1E2D]/30 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Customer Header Bar */}
          <div className="bg-gradient-to-r from-[#BE1E2D] to-red-800 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white/20 text-white rounded-lg text-xs font-black tracking-wider uppercase">
                KHÁCH HÀNG {String(currentCustomerIndex + 1).padStart(2, '0')} / {totalAssigned}
              </span>
              <div className="hidden sm:block text-xs text-red-100">
                (STT danh sách: {currentCustomer.stt})
              </div>
            </div>

            {/* Quick Navigation Between Assigned Customers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentCustomerIndex === 0}
                onClick={() => setCurrentCustomerIndex((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
                title="Khách hàng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentCustomerIndex === myCustomers.length - 1}
                onClick={() => setCurrentCustomerIndex((prev) => Math.min(myCustomers.length - 1, prev + 1))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
                title="Khách hàng tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-6">
            {/* Customer Info Card & Call Button */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Thông tin khách hàng
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                  {currentCustomer.fullName}
                </h2>
                <div className="text-lg font-mono font-bold text-[#003B70] mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>📞 {currentCustomer.phone}</span>
                </div>
              </div>

              {/* Big "GỌI KHÁCH HÀNG" button with tel: protocol (Section XII) */}
              <a
                href={`tel:${currentCustomer.phone}`}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2.5 transition-transform active:scale-95 text-center"
              >
                <Phone className="w-5 h-5 fill-current" />
                <span>📞 GỌI KHÁCH HÀNG</span>
              </a>
            </div>

            {/* SECTION XII: Kịch bản / Nội dung cần trao đổi */}
            <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#BE1E2D] uppercase tracking-wider mb-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>NỘI DUNG CẦN TRAO ĐỔI (ĐỌC KHI GỌI):</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal italic">
                "{activeCampaign.script}"
              </p>
            </div>

            {/* SECTION XIII: Cập nhật kết quả (3 trạng thái chính) */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>1. Trạng thái kết nối cuộc gọi <span className="text-red-600">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Cán bộ chủ động xác nhận (không tự động đổi trạng thái)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* ĐÃ LIÊN HỆ */}
                <button
                  type="button"
                  onClick={() => {
                    setCallStatus('contacted');
                    if (!callResult) setCallResult('announced');
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    callStatus === 'contacted'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-emerald-800">🟢 ĐÃ LIÊN HỆ</span>
                    {callStatus === 'contacted' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Đã nói chuyện và trao đổi được với khách hàng
                  </div>
                </button>

                {/* KHÔNG LIÊN HỆ ĐƯỢC */}
                <button
                  type="button"
                  onClick={() => {
                    setCallStatus('cannot_contact');
                    setCallResult(undefined);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    callStatus === 'cannot_contact'
                      ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-rose-800">🔴 KHÔNG LIÊN HỆ ĐƯỢC</span>
                    {callStatus === 'cannot_contact' && (
                      <CheckCircle2 className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Thuê bao, máy bận, tắt máy, không nhấc máy
                  </div>
                </button>

                {/* CHƯA LIÊN HỆ */}
                <button
                  type="button"
                  onClick={() => {
                    setCallStatus('not_contacted');
                    setCallResult(undefined);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    callStatus === 'not_contacted'
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-amber-800">🟡 CHƯA LIÊN HỆ</span>
                    {callStatus === 'not_contacted' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Chưa thực hiện cuộc gọi
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION XIV & XV: KẾT QUẢ CHI TIẾT (Nếu chọn ĐÃ LIÊN HỆ) */}
            {callStatus === 'contacted' && (
              <div className="p-5 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    2. Kết quả cuộc gọi chi tiết <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'announced', label: 'Đã thông báo' },
                      { id: 'interested', label: 'Khách hàng quan tâm' },
                      { id: 'callback_requested', label: 'Đề nghị gọi lại 🔔' },
                      { id: 'not_interested', label: 'Khách không có nhu cầu' },
                      { id: 'other', label: 'Khác' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCallResult(opt.id as CallResult)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                          callResult === opt.id
                            ? 'bg-[#BE1E2D] text-white border-[#BE1E2D] shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION XV: HẸN GỌI LẠI (Nếu chọn "Khách hàng đề nghị gọi lại") */}
                {callResult === 'callback_requested' && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Bell className="w-4 h-4 text-purple-700" />
                      <span>Đặt lịch hẹn gọi lại</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Ngày gọi lại <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Giờ gọi lại
                        </label>
                        <input
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Ghi chú cuộc gọi
              </label>
              <input
                type="text"
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Ví dụ: KH đề nghị gọi lại vào buổi chiều; KH hỏi thêm kỳ hạn 6 tháng..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:bg-white transition-all"
              />
            </div>

            {/* Notification alert if saved */}
            {saveSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessNotice}</span>
              </div>
            )}

            {/* SECTION XVI: BIG "LƯU & KHÁCH HÀNG TIẾP THEO →" BUTTON */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextIdx = findNextUncontactedIndex(currentCustomerIndex);
                  setCurrentCustomerIndex(nextIdx);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline order-2 sm:order-1"
              >
                Bỏ qua, gọi khách hàng khác
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="w-full sm:w-auto px-8 py-4 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-2xl font-black text-base shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 transition-all active:scale-98 order-1 sm:order-2"
              >
                <span>LƯU & KHÁCH HÀNG TIẾP THEO</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
