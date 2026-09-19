import React from 'react';
import { CallStatus, CallResult, CampaignStatus } from '../types';
import { PhoneCall, Clock, PhoneOff, CheckCircle2, AlertCircle } from 'lucide-react';

export function CallStatusBadge({ status }: { status: CallStatus }) {
  switch (status) {
    case 'contacted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đã liên hệ
        </span>
      );
    case 'cannot_contact':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Không liên hệ được
        </span>
      );
    case 'not_contacted':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Chưa liên hệ
        </span>
      );
  }
}

export function CallResultBadge({ result }: { result?: CallResult }) {
  if (!result) return null;

  const config: Record<CallResult, { label: string; bg: string; text: string; border: string }> = {
    announced: {
      label: 'Đã thông báo',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    interested: {
      label: 'Khách hàng quan tâm',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    callback_requested: {
      label: 'Đề nghị gọi lại',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    not_interested: {
      label: 'Không có nhu cầu',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    other: {
      label: 'Khác',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
    },
  };

  const item = config[result] || config.other;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.bg} ${item.text} ${item.border}`}>
      {item.label}
    </span>
  );
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Đang thực hiện
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Hoàn thành
        </span>
      );
    case 'closed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Đã đóng
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Bản nháp
        </span>
      );
  }
}
