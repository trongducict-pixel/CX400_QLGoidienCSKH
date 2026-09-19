import * as XLSX from 'xlsx';
import { ExcelCustomerRow, ExcelValidationResult } from '../types';

// Normalize phone number (removes spaces, dots, dashes, converts +84 to 0)
export function normalizePhone(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null) return '';
  let str = String(raw).trim();
  str = str.replace(/[\s\.\-_]/g, '');
  if (str.startsWith('+84')) {
    str = '0' + str.slice(3);
  } else if (str.startsWith('84') && str.length > 9) {
    str = '0' + str.slice(2);
  }
  return str;
}

// Check if valid Vietnamese mobile/landline phone number
export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;
  // Vietnamese phone numbers are typically 10 digits starting with 0
  const vietnamesePhoneRegex = /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  // Also support general 10-11 digit numbers starting with 0 (e.g. 024... for landlines)
  const generalPhoneRegex = /^0\d{9,10}$/;
  return vietnamesePhoneRegex.test(phone) || generalPhoneRegex.test(phone);
}

export function parseAndValidateExcel(fileData: ArrayBuffer): Promise<ExcelValidationResult> {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(fileData, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('File Excel không có sheet nào.');
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rawRows.length === 0) {
        throw new Error('File Excel rỗng hoặc không có dữ liệu.');
      }

      // Find header row (looks for "Họ và tên" or "Số điện thoại")
      let headerRowIndex = -1;
      let nameColIndex = -1;
      let phoneColIndex = -1;
      let sttColIndex = -1;

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim().toLowerCase();
          if (val.includes('họ và tên') || val.includes('họ tên') || val === 'tên khách hàng' || val === 'khách hàng') {
            nameColIndex = c;
          }
          if (val.includes('số điện thoại') || val.includes('điện thoại') || val === 'sđt' || val === 'sdt' || val === 'phone') {
            phoneColIndex = c;
          }
          if (val === 'stt' || val === 'số tt' || val === 'no' || val === 'tt') {
            sttColIndex = c;
          }
        }
        if (nameColIndex !== -1 && phoneColIndex !== -1) {
          headerRowIndex = r;
          break;
        }
      }

      // Fallback if no explicit header found: assume col 0 is STT (or Name), col 1 is Name, col 2 is Phone
      if (headerRowIndex === -1) {
        if (rawRows.length > 0 && rawRows[0].length >= 2) {
          headerRowIndex = 0;
          nameColIndex = rawRows[0].length >= 3 ? 1 : 0;
          phoneColIndex = rawRows[0].length >= 3 ? 2 : 1;
          sttColIndex = rawRows[0].length >= 3 ? 0 : -1;
        } else {
          throw new Error('File Excel không tìm thấy cột "Họ và tên" hoặc "Số điện thoại".');
        }
      }

      const validRows: ExcelCustomerRow[] = [];
      const missingPhoneRows: ExcelCustomerRow[] = [];
      const invalidPhoneRows: ExcelCustomerRow[] = [];
      const duplicatePhoneRows: ExcelCustomerRow[] = [];
      const seenPhones = new Set<string>();

      let rowCounter = 1;
      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || !Array.isArray(row)) continue;

        const rawName = String(row[nameColIndex] || '').trim();
        const rawPhone = row[phoneColIndex];
        const rawStt = sttColIndex !== -1 && row[sttColIndex] ? row[sttColIndex] : rowCounter;

        // Skip completely blank rows
        if (!rawName && (!rawPhone || String(rawPhone).trim() === '')) {
          continue;
        }

        const normalizedPhone = normalizePhone(rawPhone);
        const customerRow: ExcelCustomerRow = {
          stt: rawStt,
          fullName: rawName || `Khách hàng ${rowCounter}`,
          phone: normalizedPhone,
        };

        if (!normalizedPhone) {
          customerRow.error = 'Thiếu số điện thoại';
          missingPhoneRows.push(customerRow);
        } else if (!isValidVietnamesePhone(normalizedPhone)) {
          customerRow.error = `Số điện thoại không hợp lệ (${normalizedPhone})`;
          invalidPhoneRows.push(customerRow);
        } else if (seenPhones.has(normalizedPhone)) {
          customerRow.error = `Trùng số điện thoại (${normalizedPhone})`;
          customerRow.isDuplicate = true;
          duplicatePhoneRows.push(customerRow);
        } else {
          seenPhones.add(normalizedPhone);
          validRows.push(customerRow);
        }

        rowCounter++;
      }

      const totalRows = validRows.length + missingPhoneRows.length + invalidPhoneRows.length + duplicatePhoneRows.length;

      resolve({
        totalRows,
        validRows,
        missingPhoneRows,
        invalidPhoneRows,
        duplicatePhoneRows,
        isValid: validRows.length > 0,
      });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Generate a sample downloadable Excel template for users
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    { 'STT': 1, 'Họ và tên': 'Nguyễn Văn An', 'Số điện thoại': '0988123456' },
    { 'STT': 2, 'Họ và tên': 'Trần Thị Bích', 'Số điện thoại': '0978234567' },
    { 'STT': 3, 'Họ và tên': 'Lê Văn Cường', 'Số điện thoại': '0918345678' },
    { 'STT': 4, 'Họ và tên': 'Phạm Thị Dung', 'Số điện thoại': '0903456789' },
    { 'STT': 5, 'Họ và tên': 'Hoàng Minh Đức', 'Số điện thoại': '0965567890' },
    { 'STT': 6, 'Họ và tên': 'Vũ Thị Hoa', 'Số điện thoại': '0942678901' },
    { 'STT': 7, 'Họ và tên': 'Đặng Quốc Huy', 'Số điện thoại': '0936789012' },
    { 'STT': 8, 'Họ và tên': 'Bùi Thị Mai', 'Số điện thoại': '0924890123' },
    { 'STT': 9, 'Họ và tên': 'Đỗ Thành Long', 'Số điện thoại': '0981901234' },
    { 'STT': 10, 'Họ và tên': 'Ngô Phương Thảo', 'Số điện thoại': '0973012345' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // STT
    { wch: 26 }, // Họ và tên
    { wch: 18 }, // Số điện thoại
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_sach_KH');
  XLSX.writeFile(workbook, 'Mau_Danh_Sach_Khach_Hang_VietinBank.xlsx');
}

// Export campaign report to Excel
export interface ExportReportItem {
  stt: number;
  fullName: string;
  phone: string;
  staffName: string;
  statusText: string;
  resultText: string;
  callDate: string;
  callTime: string;
  followUpDate: string;
  followUpTime: string;
  note: string;
}

export function exportCampaignToExcel(
  campaignName: string,
  items: ExportReportItem[],
  filenamePrefix: string = 'Bao_Cao_Chien_Dich'
): void {
  const formattedData = items.map((item) => ({
    'STT': item.stt,
    'Họ và tên': item.fullName,
    'Số điện thoại': item.phone,
    'Cán bộ phụ trách': item.staffName || 'Chưa phân công',
    'Trạng thái': item.statusText,
    'Kết quả cuộc gọi': item.resultText,
    'Ngày gọi': item.callDate,
    'Giờ gọi': item.callTime,
    'Ngày gọi lại': item.followUpDate,
    'Giờ gọi lại': item.followUpTime,
    'Ghi chú': item.note,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 25 }, // Họ tên
    { wch: 15 }, // SĐT
    { wch: 20 }, // Cán bộ
    { wch: 18 }, // Trạng thái
    { wch: 24 }, // Kết quả
    { wch: 14 }, // Ngày gọi
    { wch: 10 }, // Giờ gọi
    { wch: 14 }, // Ngày gọi lại
    { wch: 12 }, // Giờ gọi lại
    { wch: 35 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  const safeName = campaignName.replace(/[\\/?*[\]]/g, '').slice(0, 30);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeName || 'BaoCao');

  const cleanFilename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}
