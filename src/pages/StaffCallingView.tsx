import React, { useState, useEffect } from 'react';
import { User, Campaign, Customer, Assignment, CallRecord, CallStatus, CallResult } from '../types';
import { db } from '../services/storage';
import { syncCallRecordToGoogleSheets } from '../services/googleSheetsService';
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
  Copy,
  Check,
  List,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  CheckCheck,
} from 'lucide-react';

interface StaffCallingViewProps {
  currentUser: User;
  campaigns: Campaign[];
  customers: Customer[];
  assignments: Assignment[];
  callRecords: CallRecord[];
  initialCustomerId?: string | null;
  onDataUpdated: () => void;
  onViewCallbacks: () => void;
}

export function StaffCallingView({
  currentUser,
  campaigns,
  customers,
  assignments,
  callRecords,
  initialCustomerId,
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

  // Mobile drawer / customer list modal state
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Form states for the currently selected customer
  const currentCustomer = myCustomers[currentCustomerIndex];
  const currentRecord = currentCustomer ? recordMap.get(currentCustomer.id) : undefined;

  const [callStatus, setCallStatus] = useState<CallStatus>('not_contacted');
  const [callResult, setCallResult] = useState<CallResult | undefined>(undefined);
  const [callNote, setCallNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('09:00');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // If initialCustomerId is passed, switch to that customer immediately
  useEffect(() => {
    if (initialCustomerId) {
      const targetCust = customers.find((c) => c.id === initialCustomerId);
      if (targetCust) {
        setSelectedCampaignId(targetCust.campaignId);
        const idx = myCustomers.findIndex((c) => c.id === initialCustomerId);
        if (idx >= 0) {
          setCurrentCustomerIndex(idx);
          setIsCallingActive(true);
        }
      }
    }
  }, [initialCustomerId]);

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
    setCopiedPhone(false);
  }, [currentCustomerIndex, currentCustomer?.id, currentRecord]);

  // Copy phone number to clipboard
  const handleCopyPhone = () => {
    if (!currentCustomer) return;
    navigator.clipboard?.writeText(currentCustomer.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

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

  // Quick Callback Presets helper
  const handleSetCallbackPreset = (type: 'today_afternoon' | 'today_evening' | 'tomorrow_morning' | 'tomorrow_afternoon' | 'next_monday') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === 'today_afternoon') {
      setFollowUpDate(toYMD(now));
      setFollowUpTime('14:30');
    } else if (type === 'today_evening') {
      setFollowUpDate(toYMD(now));
      setFollowUpTime('17:00');
    } else if (type === 'tomorrow_morning') {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setFollowUpDate(toYMD(tomorrow));
      setFollowUpTime('09:00');
    } else if (type === 'tomorrow_afternoon') {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setFollowUpDate(toYMD(tomorrow));
      setFollowUpTime('14:30');
    } else if (type === 'next_monday') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
      const nextMon = new Date(d.setDate(diff));
      setFollowUpDate(toYMD(nextMon));
      setFollowUpTime('09:00');
    }
  };

  // Quick Note Append helper
  const handleAppendNote = (tag: string) => {
    if (callNote.includes(tag)) return;
    setCallNote((prev) => (prev ? `${prev}, ${tag}` : tag));
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

    // Tự động đẩy kết quả cuộc gọi lên Google Sheets mặc định
    syncCallRecordToGoogleSheets(currentCustomer, activeCampaign, currentUser, {
      status: callStatus,
      result: callResult,
      statusText: callStatus === 'contacted' ? 'Đã liên hệ' : 'Không liên hệ được',
      resultText:
        callResult === 'announced'
          ? 'Đã thông báo'
          : callResult === 'interested'
          ? 'Khách hàng quan tâm'
          : callResult === 'callback_requested'
          ? 'Đề nghị gọi lại'
          : callResult === 'not_interested'
          ? 'Không có nhu cầu'
          : 'Khác',
      note: callNote.trim(),
      followUpDate: followUpDate,
      followUpTime: followUpTime,
    }).catch((err) => console.error('Lỗi gửi Google Sheets Webhook:', err));

    onDataUpdated();

    setSaveSuccessNotice(`✓ Đã lưu kết quả cho ${currentCustomer.fullName}`);

    // Auto-advance to next customer
    setTimeout(() => {
      const nextIdx = findNextUncontactedIndex(currentCustomerIndex);
      setCurrentCustomerIndex(nextIdx);
    }, 250);
  };

  if (!activeCampaign) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Chưa có chiến dịch nào được giao</h3>
        <p className="text-xs text-slate-500 mt-1">
          Lãnh đạo Phòng DVKH chưa phân công khách hàng trong chiến dịch nào cho bạn. Vui lòng liên hệ lãnh đạo phòng để được giao việc.
        </p>
      </div>
    );
  }

  // Filtered customer list for jump drawer
  const filteredJumpCustomers = myCustomers.filter((c) =>
    c.fullName.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
    c.phone.includes(listSearchTerm.trim())
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20 sm:pb-8">
      {/* MOBILE-OPTIMIZED TOP HEADER / DASHBOARD CARD */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        {/* Staff & Campaign Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#BE1E2D] uppercase tracking-wider">
                CÁN BỘ CSKH DI ĐỘNG
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{currentUser.fullName}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                  {currentUser.username}
                </span>
              </h1>
            </div>

            {/* Calling view mode toggle button on mobile */}
            {isCallingActive && (
              <button
                type="button"
                onClick={() => setIsCallingActive(false)}
                className="sm:hidden text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                Tổng quan
              </button>
            )}
          </div>

          {/* Campaign Selector */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value);
                setIsCallingActive(false);
                setCurrentCustomerIndex(0);
              }}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#BE1E2D] focus:outline-none truncate"
            >
              {campaigns.map((cmp) => (
                <option key={cmp.id} value={cmp.id}>
                  {cmp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress bar and compact stats */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">
              Được giao: <strong className="text-[#BE1E2D]">{totalAssigned} KH</strong>
            </span>
            <span className="text-emerald-700">
              Tiến độ: {completedCount}/{totalAssigned} ({progressPercent}%)
            </span>
          </div>

          <ProgressBar value={progressPercent} showText={false} size="sm" />

          {/* 4 Ultra-Compact Counters optimized for mobile screens */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] sm:text-xs text-emerald-800 block font-semibold truncate">
                🟢 Đã gọi
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-700">{contactedCount}</span>
            </div>

            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[10px] sm:text-xs text-amber-800 block font-semibold truncate">
                🟡 Chưa gọi
              </span>
              <span className="text-base sm:text-xl font-black text-amber-700">{notContactedCount}</span>
            </div>

            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[10px] sm:text-xs text-rose-800 block font-semibold truncate">
                🔴 Không LH
              </span>
              <span className="text-base sm:text-xl font-black text-rose-700">{cannotContactCount}</span>
            </div>

            <div
              onClick={onViewCallbacks}
              className="p-2 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer hover:border-purple-400 transition-colors"
            >
              <span className="text-[10px] sm:text-xs text-purple-800 block font-semibold truncate">
                🔔 Gọi lại
              </span>
              <span className="text-base sm:text-xl font-black text-purple-700">{callbackCount}</span>
            </div>
          </div>

          {/* Big Start Calling button if not in calling mode */}
          {!isCallingActive && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartCalling}
                className="w-full py-3.5 sm:py-4 bg-[#BE1E2D] hover:bg-[#a61825] active:scale-98 text-white rounded-2xl text-sm sm:text-base font-black shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2.5"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>BẮT ĐẦU GỌI ({notContactedCount} KH CHƯA GỌI)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED MOBILE-OPTIMIZED CALLING WORKSPACE */}
      {isCallingActive && currentCustomer && (
        <div className="bg-white rounded-2xl border-2 border-[#BE1E2D]/40 shadow-xl overflow-hidden animate-in fade-in">
          {/* Top Control Strip */}
          <div className="bg-gradient-to-r from-[#BE1E2D] to-red-800 text-white px-3 sm:px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomerListOpen(true)}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black tracking-wider flex items-center gap-1.5 transition-colors"
                title="Bấm để chọn nhanh khách hàng"
              >
                <List className="w-3.5 h-3.5" />
                <span>KH {String(currentCustomerIndex + 1).padStart(2, '0')}/{totalAssigned}</span>
              </button>
              <span className="text-[11px] text-red-200 hidden sm:inline">
                (STT: {currentCustomer.stt})
              </span>
            </div>

            {/* Quick Navigation Prev / Next */}
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
              <span className="text-xs font-mono font-bold px-1.5">
                {currentCustomerIndex + 1}
              </span>
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

          <div className="p-4 sm:p-6 space-y-4">
            {/* 1. CUSTOMER IDENTITY & BIG 1-TAP CALL BUTTON (MOBILE-FIRST) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Khách hàng • STT: {currentCustomer.stt}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {currentCustomer.fullName}
                  </h2>
                </div>

                {/* Status badge if already called before */}
                {currentRecord && (
                  <CallStatusBadge status={currentRecord.status} />
                )}
              </div>

              {/* 1-Tap Click-to-Call Phone Button (Touch target min 52px) */}
              <div className="flex items-stretch gap-2">
                <a
                  href={`tel:${currentCustomer.phone}`}
                  className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-98 text-white rounded-2xl font-black text-base sm:text-lg shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2.5 transition-all text-center"
                >
                  <Phone className="w-5 h-5 fill-current shrink-0 animate-bounce" />
                  <span className="truncate">GỌI: {currentCustomer.phone}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-slate-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                  title="Sao chép số điện thoại"
                >
                  {copiedPhone ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-500" />
                  )}
                </button>
              </div>
              {copiedPhone && (
                <div className="text-[11px] font-bold text-emerald-600 text-center animate-in fade-in">
                  ✓ Đã sao chép số điện thoại vào bộ nhớ tạm
                </div>
              )}
            </div>

            {/* 2. CALL SCRIPT ACCORDION (COLLAPSIBLE TO SAVE MOBILE VERTICAL SPACE) */}
            <div className="bg-red-50/70 border border-red-200/80 rounded-2xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#BE1E2D] uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-[#BE1E2D]" />
                  <span>KỊCH BẢN TRAO ĐỔI VỚI KHÁCH HÀNG</span>
                </div>
                <div className="text-slate-400 p-0.5">
                  {isScriptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isScriptExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-red-100/80">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic font-normal">
                    "{activeCampaign.script}"
                  </p>
                </div>
              )}
            </div>

            {/* 3. STEP 1: CONNECTION STATUS (3 BIG TOUCH CARDS) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>1. Kết nối cuộc gọi <span className="text-red-600">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">Chạm để chọn</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* ĐÃ LIÊN HỆ */}
                <button
                  type="button"
                  onClick={() => {
                    setCallStatus('contacted');
                    if (!callResult) setCallResult('announced');
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all active:scale-98 ${
                    callStatus === 'contacted'
                      ? 'border-emerald-600 bg-emerald-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
                      🟢 ĐÃ LIÊN HỆ
                    </span>
                    {callStatus === 'contacted' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Đã trao đổi được với khách
                  </div>
                </button>

                {/* KHÔNG LIÊN HỆ ĐƯỢC */}
                <button
                  type="button"
                  onClick={() => {
                    setCallStatus('cannot_contact');
                    setCallResult(undefined);
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all active:scale-98 ${
                    callStatus === 'cannot_contact'
                      ? 'border-rose-600 bg-rose-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-rose-800 flex items-center gap-1.5">
                      🔴 KHÔNG LIÊN HỆ ĐƯỢC
                    </span>
                    {callStatus === 'cannot_contact' && (
                      <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Máy bận, tắt máy, không nghe
                  </div>
                </button>

                {/* CHƯA LIÊN HỆ */}
                <button
                  type="button"
                  onClick={() => {
                    setCallStatus('not_contacted');
                    setCallResult(undefined);
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all active:scale-98 ${
                    callStatus === 'not_contacted'
                      ? 'border-amber-500 bg-amber-50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-amber-800 flex items-center gap-1.5">
                      🟡 CHƯA LIÊN HỆ
                    </span>
                    {callStatus === 'not_contacted' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Chưa bấm máy gọi
                  </div>
                </button>
              </div>
            </div>

            {/* 4. STEP 2: DETAILED OUTCOME (IF CONTACTED) */}
            {callStatus === 'contacted' && (
              <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Kết quả trao đổi chi tiết <span className="text-red-600">*</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'announced', label: 'Đã thông báo' },
                    { id: 'interested', label: 'Khách quan tâm' },
                    { id: 'callback_requested', label: 'Hẹn gọi lại 🔔' },
                    { id: 'not_interested', label: 'Không nhu cầu' },
                    { id: 'other', label: 'Khác' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCallResult(opt.id as CallResult)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center active:scale-95 ${
                        callResult === opt.id
                          ? 'bg-[#BE1E2D] text-white border-[#BE1E2D] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* STEP 3: CALLBACK SCHEDULE WITH QUICK PRESETS */}
                {callResult === 'callback_requested' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2.5 mt-2">
                    <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Bell className="w-4 h-4 text-purple-700" />
                      <span>Đặt lịch hẹn gọi lại</span>
                    </div>

                    {/* Quick Preset Pills for Phone Users */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetCallbackPreset('today_afternoon')}
                        className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-[11px] font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                      >
                        ⚡ Chiều nay 14:30
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCallbackPreset('tomorrow_morning')}
                        className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-[11px] font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                      >
                        ⚡ Sáng mai 09:00
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCallbackPreset('tomorrow_afternoon')}
                        className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-[11px] font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                      >
                        ⚡ Chiều mai 14:30
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCallbackPreset('next_monday')}
                        className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-[11px] font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                      >
                        ⚡ Thứ Hai tuần sau
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Ngày gọi lại <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Giờ gọi lại
                        </label>
                        <input
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. GHI CHÚ CUỘC GỌI VỚI CÁC PHÍM TẮT NHẬP NHANH (QUICK TAGS) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ghi chú cuộc gọi
                </label>
                <span className="text-[10px] text-slate-400">Chọn nhanh bên dưới:</span>
              </div>

              {/* Quick Tags for fast phone input */}
              <div className="flex flex-wrap gap-1 pb-1">
                {[
                  'Thuê bao / Tắt máy',
                  'Không nhấc máy',
                  'Máy bận',
                  'Đang bận họp',
                  'Đồng ý tham gia',
                  'Cần suy nghĩ thêm',
                  'Sai số / Nhầm máy',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendNote(tag)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md text-[11px] font-medium text-slate-700 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Ghi chú thêm nội dung trao đổi..."
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

            {/* DESKTOP ACTION BAR */}
            <div className="hidden sm:flex pt-3 border-t border-slate-100 items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextIdx = findNextUncontactedIndex(currentCustomerIndex);
                  setCurrentCustomerIndex(nextIdx);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
              >
                Bỏ qua, gọi khách hàng khác
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-8 py-3.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-red-900/20 flex items-center justify-center gap-2.5 transition-all active:scale-98"
              >
                <span>LƯU & KHÁCH TIẾP THEO</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FIXED / STICKY BOTTOM ACTION BAR (OPTIMIZED FOR THUMB REACH) */}
      {isCallingActive && currentCustomer && (
        <div className="sm:hidden fixed bottom-12 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 shadow-2xl flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextIdx = findNextUncontactedIndex(currentCustomerIndex);
              setCurrentCustomerIndex(nextIdx);
            }}
            className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 active:scale-95"
          >
            Bỏ qua
          </button>

          <button
            type="button"
            onClick={handleSaveAndNext}
            className="flex-1 py-3 px-4 bg-[#BE1E2D] hover:bg-[#a61825] active:bg-[#8a1420] text-white rounded-xl font-black text-sm shadow-md shadow-red-900/20 flex items-center justify-center gap-2 active:scale-98"
          >
            <span>LƯU & KHÁCH TIẾP THEO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK CUSTOMER LIST DRAWER / MODAL FOR MOBILE FAST JUMP */}
      {isCustomerListOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold">Danh sách khách hàng được giao</h3>
                <p className="text-[11px] text-slate-300">
                  {completedCount}/{totalAssigned} khách hàng đã thực hiện
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerListOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter in drawer */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={listSearchTerm}
                  onChange={(e) => setListSearchTerm(e.target.value)}
                  placeholder="Tìm tên hoặc SĐT..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#BE1E2D] focus:outline-none"
                />
              </div>
            </div>

            {/* Scrollable Customer List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100">
              {filteredJumpCustomers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Không tìm thấy khách hàng nào.
                </div>
              ) : (
                filteredJumpCustomers.map((cust) => {
                  const origIdx = myCustomers.findIndex((c) => c.id === cust.id);
                  const isCurrent = origIdx === currentCustomerIndex;
                  const rec = recordMap.get(cust.id);
                  const status = rec?.status || 'not_contacted';

                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        setCurrentCustomerIndex(origIdx);
                        setIsCustomerListOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                        isCurrent
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {cust.stt}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {cust.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {cust.phone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <CallStatusBadge status={status} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
