import React, { useState } from 'react';
import { User, ExcelValidationResult, ExcelCustomerRow, Campaign, Customer, Assignment, CallRecord } from '../types';
import { db } from '../services/storage';
import { parseAndValidateExcel, downloadSampleExcelTemplate } from '../services/excelService';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CreateCampaignModalProps {
  currentUser: User;
  staffUsers: User[];
  onClose: () => void;
  onSuccess: (newCampaignId: string) => void;
}

export function CreateCampaignModal({
  currentUser,
  staffUsers,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  // Step 1: Info, Step 2: Upload Excel, Step 3: Assignment, Step 4: Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Excel State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'all' | 'valid' | 'errors'>('all');

  // Assignment State
  // Map of customer index to staffId
  const [customerAssignments, setCustomerAssignments] = useState<Map<number, string>>(new Map());
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    staffUsers.map((s) => s.id)
  );

  // Handle Excel File Upload
  const handleFileUpload = async (file: File) => {
    setExcelFile(file);
    setFileName(file.name);
    setIsParsing(true);
    setParseError(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseAndValidateExcel(buffer);
      setValidationResult(result);
      if (!result.isValid) {
        setParseError('Không tìm thấy dòng dữ liệu khách hàng hợp lệ nào.');
      }
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc file Excel.');
      setValidationResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Quick Seed Demo Data if user wants to test quickly without uploading a file
  const handleUseDemoList = () => {
    const demoRows: ExcelCustomerRow[] = [
      { stt: 1, fullName: 'Nguyễn Văn An', phone: '0988123456' },
      { stt: 2, fullName: 'Trần Thị Bích', phone: '0978234567' },
      { stt: 3, fullName: 'Lê Văn Cường', phone: '0918345678' },
      { stt: 4, fullName: 'Phạm Thị Dung', phone: '0903456789' },
      { stt: 5, fullName: 'Hoàng Minh Đức', phone: '0965567890' },
      { stt: 6, fullName: 'Vũ Thị Hoa', phone: '0942678901' },
      { stt: 7, fullName: 'Đặng Quốc Huy', phone: '0936789012' },
      { stt: 8, fullName: 'Bùi Thị Mai', phone: '0924890123' },
      { stt: 9, fullName: 'Đỗ Thành Long', phone: '0981901234' },
      { stt: 10, fullName: 'Ngô Phương Thảo', phone: '0973012345' },
      { stt: 11, fullName: 'Trương Quốc Anh', phone: '0912345987' },
      { stt: 12, fullName: 'Lâm Hoài Thu', phone: '0987654321' },
      { stt: 13, fullName: 'Vương Đình Huệ', phone: '0909123890' },
      { stt: 14, fullName: 'Phan Diệu Huyền', phone: '0966789012' },
      { stt: 15, fullName: 'Hà Văn Nam', phone: '0944567890' },
    ];

    setValidationResult({
      totalRows: 15,
      validRows: demoRows,
      missingPhoneRows: [],
      invalidPhoneRows: [],
      duplicatePhoneRows: [],
      isValid: true,
    });
    setFileName('Danh_sach_KH_mau_VietinBank.xlsx');
    setParseError(null);
  };

  // Section X - A: Automatic assignment
  const handleAutoAssign = () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    if (selectedStaffIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cán bộ để phân công.');
      return;
    }

    const assignments = new Map<number, string>();
    const staffCount = selectedStaffIds.length;
    const validRows = validationResult.validRows;

    // Distribute evenly, distributing remainder sequentially
    validRows.forEach((row, idx) => {
      const staffId = selectedStaffIds[idx % staffCount];
      assignments.set(idx, staffId);
    });

    setCustomerAssignments(assignments);
  };

  // Manual assign selected row
  const handleManualAssign = (rowIdx: number, staffId: string) => {
    const updated = new Map(customerAssignments);
    if (staffId) {
      updated.set(rowIdx, staffId);
    } else {
      updated.delete(rowIdx);
    }
    setCustomerAssignments(updated);
  };

  // Batch assign all unassigned to a specific staff
  const handleAssignAllToStaff = (staffId: string) => {
    if (!validationResult) return;
    const updated = new Map(customerAssignments);
    validationResult.validRows.forEach((_, idx) => {
      updated.set(idx, staffId);
    });
    setCustomerAssignments(updated);
  };

  // Toggle staff selection for auto assign
  const toggleStaffSelection = (staffId: string) => {
    if (selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, staffId]);
    }
  };

  // Validation before step transition
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        alert('Vui lòng nhập tên chiến dịch.');
        return;
      }
      if (!script.trim()) {
        alert('Vui lòng nhập nội dung trao đổi / kịch bản gọi điện.');
        return;
      }
      if (!startDate || !endDate) {
        alert('Vui lòng chọn thời gian bắt đầu và kết thúc.');
        return;
      }
      if (endDate < startDate) {
        alert('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validationResult || !validationResult.isValid || validationResult.validRows.length === 0) {
        alert('Vui lòng tải lên file Excel hợp lệ hoặc sử dụng danh sách mẫu.');
        return;
      }
      // Trigger default auto assignment if not yet done
      if (customerAssignments.size === 0) {
        handleAutoAssign();
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validationResult) return;
      const unassignedCount = validationResult.validRows.length - customerAssignments.size;
      if (unassignedCount > 0) {
        if (!confirm(`Còn ${unassignedCount} khách hàng chưa được phân công. Bạn có muốn tự động chia đều cho các cán bộ không?`)) {
          return;
        }
        handleAutoAssign();
      }
      setCurrentStep(4);
    }
  };

  // Final Confirmation & Save to Database
  const handleSaveCampaign = (activateImmediately: boolean = true) => {
    if (!validationResult) return;

    const campaignId = `cmp-${Date.now()}`;
    const newCampaign: Campaign = {
      id: campaignId,
      name: name.trim(),
      description: description.trim() || name.trim(),
      script: script.trim(),
      startDate,
      endDate,
      status: activateImmediately ? 'in_progress' : 'draft',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    // Prepare Customers
    const newCustomers: Customer[] = validationResult.validRows.map((row, idx) => ({
      id: `cust-${campaignId}-${idx + 1}`,
      campaignId,
      stt: Number(row.stt) || idx + 1,
      fullName: row.fullName,
      phone: row.phone,
      createdAt: new Date().toISOString(),
    }));

    // Prepare Assignments & Initial CallRecords
    const newAssignments: Assignment[] = [];
    const newCallRecords: CallRecord[] = [];

    newCustomers.forEach((cust, idx) => {
      const staffId = customerAssignments.get(idx) || selectedStaffIds[0] || staffUsers[0]?.id;
      if (staffId) {
        newAssignments.push({
          id: `asg-${campaignId}-${idx + 1}`,
          campaignId,
          customerId: cust.id,
          staffId,
          assignedAt: new Date().toISOString(),
        });

        // Initialize CallRecord with 'not_contacted'
        newCallRecords.push({
          id: `call-${campaignId}-${idx + 1}`,
          campaignId,
          customerId: cust.id,
          staffId,
          status: 'not_contacted',
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Save to Database
    db.saveCampaign(newCampaign, currentUser);
    db.saveCustomers(newCustomers);
    db.saveAssignments(newAssignments);
    
    // Save CallRecords
    const allRecords = db.getCallRecords();
    allRecords.push(...newCallRecords);
    localStorage.setItem('cx400_call_records', JSON.stringify(allRecords));

    // Audit log
    db.addActivityLog({
      userId: currentUser.id,
      userName: currentUser.fullName,
      action: 'Tạo chiến dịch mới',
      target: newCampaign.name,
      details: `Đã nhập ${newCustomers.length} khách hàng và phân công cho ${selectedStaffIds.length} cán bộ. Trạng thái: ${newCampaign.status}`,
    });

    onSuccess(campaignId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#BE1E2D] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-red-100 font-bold">
              Quy trình nghiệp vụ 4 bước
            </div>
            <h3 className="text-lg font-bold">TẠO CHIẾN DỊCH GỌI ĐIỆN CSKH</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-semibold shrink-0">
          {[
            { step: 1, label: '1. Thông tin' },
            { step: 2, label: '2. Upload & Kiểm tra Excel' },
            { step: 3, label: '3. Phân công cán bộ' },
            { step: 4, label: '4. Xác nhận & Kích hoạt' },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-center gap-1.5 ${
                currentStep === item.step
                  ? 'text-[#BE1E2D] font-bold'
                  : currentStep > item.step
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === item.step
                    ? 'bg-[#BE1E2D] text-white'
                    : currentStep > item.step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > item.step ? '✓' : item.step}
              </div>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: CAMPAIGN INFO */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  1. Tên chiến dịch <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chăm sóc khách hàng tiền gửi tháng 09/2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  2. Nội dung cần trao đổi (Kịch bản cuộc gọi) <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Nội dung này sẽ hiển thị trực tiếp trước mắt cán bộ khi họ thực hiện cuộc gọi để hướng dẫn trao đổi chuẩn mực với khách hàng.
                </p>
                <textarea
                  rows={4}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Ví dụ: Kính chào Quý khách! Em là [Tên cán bộ] từ VietinBank Chi nhánh Ninh Bình. Em xin thông báo tới Quý khách về chương trình tiền gửi tiết kiệm lãi suất ưu đãi đặc biệt tháng 09/2026 và tư vấn sản phẩm phù hợp..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D] focus:bg-white transition-all font-normal leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Mô tả / Ghi chú nội bộ
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu của chiến dịch (không bắt buộc)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                    Ngày bắt đầu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                    Ngày kết thúc <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD & VALIDATE EXCEL */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Template Download & Upload Area */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Cấu trúc file Excel yêu cầu:
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Gồm 3 cột tối thiểu: <code className="font-bold text-slate-700">STT</code>,{' '}
                    <code className="font-bold text-slate-700">Họ và tên</code>,{' '}
                    <code className="font-bold text-slate-700">Số điện thoại</code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải file Excel mẫu (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUseDemoList}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#BE1E2D] rounded-lg text-xs font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dùng 15 KH mẫu</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-[#BE1E2D] rounded-2xl p-6 text-center transition-colors bg-white">
                <input
                  type="file"
                  id="excelUploadInput"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <label
                  htmlFor="excelUploadInput"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#BE1E2D] flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Bấm để chọn file Excel (.xlsx, .xls) hoặc kéo thả vào đây
                  </div>
                  <div className="text-xs text-slate-400">
                    Hệ thống sẽ tự động kiểm tra dữ liệu dòng trống, số điện thoại thiếu, lỗi định dạng hoặc trùng lặp
                  </div>
                </label>
              </div>

              {/* Parsing status / Error */}
              {isParsing && (
                <div className="p-4 text-center text-xs text-slate-500">
                  Đang đọc và kiểm tra dữ liệu file Excel...
                </div>
              )}

              {parseError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Validation Summary Report as specified in Section IX */}
              {validationResult && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                      <span>BÁO CÁO KIỂM TRA DỮ LIỆU EXCEL ({fileName})</span>
                      <span className="font-bold text-slate-900">
                        Đã đọc {validationResult.totalRows} dòng
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-medium">
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="text-base font-black text-emerald-700">
                          {validationResult.validRows.length}
                        </div>
                        <div className="text-emerald-800 text-[11px] font-semibold">KH hợp lệ</div>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="text-base font-black text-amber-700">
                          {validationResult.missingPhoneRows.length}
                        </div>
                        <div className="text-amber-800 text-[11px] font-semibold">Thiếu SĐT</div>
                      </div>

                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                        <div className="text-base font-black text-rose-700">
                          {validationResult.invalidPhoneRows.length}
                        </div>
                        <div className="text-rose-800 text-[11px] font-semibold">SĐT không hợp lệ</div>
                      </div>

                      <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                        <div className="text-base font-black text-purple-700">
                          {validationResult.duplicatePhoneRows.length}
                        </div>
                        <div className="text-purple-800 text-[11px] font-semibold">Trùng SĐT</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Preview Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-700">Xem trước danh sách</div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('all')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            previewTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Tất cả ({validationResult.totalRows})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('valid')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            previewTab === 'valid' ? 'bg-emerald-700 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          Hợp lệ ({validationResult.validRows.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('errors')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            previewTab === 'errors' ? 'bg-rose-700 text-white' : 'text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          Có lỗi (
                          {validationResult.missingPhoneRows.length +
                            validationResult.invalidPhoneRows.length +
                            validationResult.duplicatePhoneRows.length}
                          )
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                        <thead className="bg-slate-50/70 text-slate-500 font-bold sticky top-0">
                          <tr>
                            <th className="px-3 py-2 w-12 text-center">STT</th>
                            <th className="px-4 py-2">Họ và tên</th>
                            <th className="px-4 py-2">Số điện thoại</th>
                            <th className="px-4 py-2">Trạng thái kiểm tra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {(previewTab === 'all'
                            ? [
                                ...validationResult.validRows,
                                ...validationResult.missingPhoneRows,
                                ...validationResult.invalidPhoneRows,
                                ...validationResult.duplicatePhoneRows,
                              ]
                            : previewTab === 'valid'
                            ? validationResult.validRows
                            : [
                                ...validationResult.missingPhoneRows,
                                ...validationResult.invalidPhoneRows,
                                ...validationResult.duplicatePhoneRows,
                              ]
                          ).map((row, idx) => (
                            <tr
                              key={idx}
                              className={row.error ? 'bg-rose-50/50 text-rose-900' : 'hover:bg-slate-50'}
                            >
                              <td className="px-3 py-2 text-center text-slate-400">{row.stt || idx + 1}</td>
                              <td className="px-4 py-2 font-semibold">{row.fullName}</td>
                              <td className="px-4 py-2 font-mono">{row.phone || <em className="text-slate-400">Trống</em>}</td>
                              <td className="px-4 py-2">
                                {row.error ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                                    <AlertCircle className="w-3 h-3" />
                                    {row.error}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Hợp lệ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ASSIGNMENT (Section X) */}
          {currentStep === 3 && validationResult && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Tổng số khách hàng hợp lệ: {validationResult.validRows.length} KH
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Đã phân công:{' '}
                    <strong className="text-slate-900">{customerAssignments.size}</strong> /{' '}
                    {validationResult.validRows.length} KH
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    className="px-4 py-2 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>PHÂN CHIA TỰ ĐỘNG</span>
                  </button>
                </div>
              </div>

              {/* Staff distribution summary table (Section X) */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Danh sách cán bộ & số lượng khách hàng được giao
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {staffUsers.map((staff) => {
                    // Count how many assigned to this staff
                    let count = 0;
                    customerAssignments.forEach((sId) => {
                      if (sId === staff.id) count++;
                    });
                    const isSelected = selectedStaffIds.includes(staff.id);

                    return (
                      <div
                        key={staff.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-white border-slate-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStaffSelection(staff.id)}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-800">{staff.fullName}</div>
                              <div className="text-[10px] text-slate-400">
                                {staff.username} • {staff.title}
                              </div>
                            </div>
                          </label>

                          <div className="text-right">
                            <span className="text-base font-black text-[#BE1E2D]">{count}</span>
                            <span className="text-[10px] text-slate-500 block">KH</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleAssignAllToStaff(staff.id)}
                            className="text-blue-700 font-semibold hover:underline"
                          >
                            Giao toàn bộ cho CB này
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed assignment breakdown table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Chi tiết phân công từng khách hàng</span>
                  <span className="text-slate-400 text-[11px] font-normal">
                    Có thể điều chỉnh cán bộ phụ trách cho từng dòng
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-12 text-center">STT</th>
                        <th className="px-4 py-2">Khách hàng</th>
                        <th className="px-4 py-2">Số điện thoại</th>
                        <th className="px-4 py-2">Cán bộ phụ trách</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.validRows.map((row, idx) => {
                        const assignedStaffId = customerAssignments.get(idx) || '';
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-center text-slate-400">{row.stt || idx + 1}</td>
                            <td className="px-4 py-2 font-semibold text-slate-800">{row.fullName}</td>
                            <td className="px-4 py-2 font-mono text-slate-600">{row.phone}</td>
                            <td className="px-4 py-2">
                              <select
                                value={assignedStaffId}
                                onChange={(e) => handleManualAssign(idx, e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-red-500"
                              >
                                <option value="">-- Chưa phân công --</option>
                                {staffUsers.map((staff) => (
                                  <option key={staff.id} value={staff.id}>
                                    {staff.fullName} ({staff.username})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION & ACTIVATION */}
          {currentStep === 4 && validationResult && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-900">
                    Sẵn sàng khởi tạo chiến dịch!
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Tất cả thông tin, danh sách khách hàng và phân công cán bộ đã được kiểm tra đầy đủ.
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
                  TỔNG HỢP CHIẾN DỊCH
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block">Tên chiến dịch:</span>
                    <strong className="text-slate-900 text-sm">{name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Thời gian thực hiện:</span>
                    <strong className="text-slate-900">
                      {startDate} đến {endDate}
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block">Kịch bản cuộc gọi:</span>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 italic mt-1 leading-relaxed">
                    "{script}"
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block">Tổng khách hàng:</span>
                    <span className="text-xl font-bold text-slate-900">
                      {validationResult.validRows.length} KH
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block">Số cán bộ tham gia:</span>
                    <span className="text-xl font-bold text-blue-700">
                      {selectedStaffIds.length} cán bộ
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block">Đã phân công:</span>
                    <span className="text-xl font-bold text-emerald-700">
                      {customerAssignments.size} / {validationResult.validRows.length} KH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCampaign(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Lưu bản nháp
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCampaign(true)}
                  className="px-6 py-2.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>XÁC NHẬN & KÍCH HOẠT CHIẾN DỊCH</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
