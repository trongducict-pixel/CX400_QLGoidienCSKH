import React, { useState, useEffect } from 'react';
import { Campaign, CampaignStatus, User } from '../types';
import { db } from '../services/storage';
import { X, CheckCircle2, Calendar, FileText, Megaphone, AlertCircle } from 'lucide-react';

interface EditCampaignModalProps {
  campaign: Campaign;
  currentUser: User;
  onClose: () => void;
  onSuccess: (updatedCampaign: Campaign) => void;
}

export function EditCampaignModal({
  campaign,
  currentUser,
  onClose,
  onSuccess,
}: EditCampaignModalProps) {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || '');
  const [script, setScript] = useState(campaign.script || '');
  const [startDate, setStartDate] = useState(campaign.startDate || '');
  const [endDate, setEndDate] = useState(campaign.endDate || '');
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(campaign.name);
    setDescription(campaign.description || '');
    setScript(campaign.script || '');
    setStartDate(campaign.startDate || '');
    setEndDate(campaign.endDate || '');
    setStatus(campaign.status);
    setError(null);
  }, [campaign]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên chiến dịch.');
      return;
    }
    if (!script.trim()) {
      setError('Vui lòng nhập nội dung / kịch bản cuộc gọi.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError('Ngày kết thúc không được sớm hơn ngày bắt đầu.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedCampaign: Campaign = {
        ...campaign,
        name: name.trim(),
        description: description.trim(),
        script: script.trim(),
        startDate,
        endDate,
        status,
        updatedAt: new Date().toISOString(),
      };

      db.saveCampaign(updatedCampaign, currentUser);
      onSuccess(updatedCampaign);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật chiến dịch');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Megaphone className="w-5 h-5 text-[#BE1E2D]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Chỉnh sửa chiến dịch</h2>
              <p className="text-xs text-slate-300">
                Quyền thực hiện: {currentUser.role === 'admin' ? 'Quản trị viên' : 'Lãnh đạo Phòng DVKH'} ({currentUser.fullName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tên chiến dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên chiến dịch..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:bg-white transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
              >
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="draft">Bản nháp</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kịch bản / Nội dung cuộc gọi cho cán bộ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Nhập nội dung kịch bản cán bộ CSKH cần đọc và trao đổi khi gọi..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:bg-white transition-all leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nội dung này sẽ hiển thị trực tiếp trên giao diện gọi điện của từng cán bộ CSKH phụ trách.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mô tả chi tiết / Ghi chú quản lý
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về mục tiêu, tiêu chí thực hiện..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-900/10 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
