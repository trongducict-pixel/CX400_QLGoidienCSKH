import { db } from './storage';
import { Customer, Campaign, User, CallRecord } from '../types';

export const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyQodR_gsJ_p3J4brMX5nUqOKBcYvdNIsySm_fb9t9oPfAWoEYiklv1UncAWS5bbAHN1g/exec';

export interface SyncPayload {
  action: 'append_call_record' | 'bulk_sync' | 'ping' | 'create_campaign';
  timestamp: string;
  source: string;
  data: any;
}

/**
 * Sends data payload to the default Google Apps Script Webhook URL.
 * Uses text/plain and no-cors to ensure reliable delivery without CORS interruption.
 */
export async function sendToGoogleSheetsWebhook(
  payload: SyncPayload,
  customWebhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customWebhookUrl || db.getGoogleSheetsConfig().webhookUrl || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL;

  if (!url || !url.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'Đường dẫn Google Apps Script Webhook không hợp lệ.',
    };
  }

  try {
    // We send payload as text/plain with no-cors so Google Apps Script e.postData receives JSON string without browser preflight CORS blocks
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    // Update last sync state in local storage
    const currentConfig = db.getGoogleSheetsConfig();
    db.saveGoogleSheetsConfig({
      ...currentConfig,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'success',
      syncError: undefined,
      totalSyncedRecords: (currentConfig.totalSyncedRecords || 0) + 1,
    });

    return {
      success: true,
      message: 'Đã gửi dữ liệu thành công tới Google Sheets.',
    };
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    const currentConfig = db.getGoogleSheetsConfig();
    db.saveGoogleSheetsConfig({
      ...currentConfig,
      syncStatus: 'error',
      syncError: error?.message || 'Không thể kết nối tới Google Sheets Webhook',
    });

    return {
      success: false,
      message: error?.message || 'Lỗi khi gửi dữ liệu lên Google Sheets.',
    };
  }
}

/**
 * Specific helper to sync an individual call result to Google Sheets in real-time
 */
export async function syncCallRecordToGoogleSheets(
  customer: Customer,
  campaign: Campaign,
  staff: User,
  callRecord: Partial<CallRecord> & {
    statusText: string;
    resultText: string;
  }
) {
  const config = db.getGoogleSheetsConfig();
  if (!config.autoSync) return;

  const payload: SyncPayload = {
    action: 'append_call_record',
    timestamp: new Date().toISOString(),
    source: 'VietinBank_NinhBinh_CX400',
    data: {
      maChienDich: campaign.id,
      tenChienDich: campaign.name,
      stt: customer.stt,
      tenKhachHang: customer.fullName,
      soDienThoai: customer.phone,
      canBoCSKH: staff.fullName,
      maCanBo: staff.username,
      trangThaiGoi: callRecord.statusText,
      ketQuaChiTiet: callRecord.resultText,
      ghiChu: callRecord.note || '',
      thoiGianGoi: callRecord.callTime || new Date().toLocaleString('vi-VN'),
      ngayHenGoiLai: callRecord.followUpDate || '',
      gioHenGoiLai: callRecord.followUpTime || '',
    },
  };

  return sendToGoogleSheetsWebhook(payload, config.webhookUrl);
}

/**
 * Bulk sync all recorded calls to Google Sheets
 */
export async function syncAllCallRecordsToGoogleSheets(): Promise<{ success: boolean; count: number; message: string }> {
  const campaigns = db.getCampaigns();
  const customers = db.getCustomers();
  const users = db.getUsers();
  const records = db.getCallRecords();

  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u.fullName]));

  const rows = records.map((r) => {
    const cust = customerMap.get(r.customerId);
    const cmpName = campaignMap.get(r.campaignId) || 'N/A';
    const staffName = userMap.get(r.staffId) || 'N/A';

    let statusText = 'Chưa liên hệ';
    if (r.status === 'contacted') statusText = 'Đã liên hệ';
    else if (r.status === 'cannot_contact') statusText = 'Không liên hệ được';

    let resultText = 'Chưa có kết quả';
    switch (r.result) {
      case 'announced':
        resultText = 'Đã thông báo';
        break;
      case 'interested':
        resultText = 'Khách hàng quan tâm';
        break;
      case 'callback_requested':
        resultText = 'Khách hàng đề nghị gọi lại';
        break;
      case 'not_interested':
        resultText = 'Khách hàng không có nhu cầu';
        break;
      case 'other':
        resultText = 'Khác';
        break;
    }

    return {
      id: r.id,
      campaignName: cmpName,
      customerName: cust?.fullName || 'N/A',
      phone: cust?.phone || 'N/A',
      staffName: staffName,
      status: statusText,
      result: resultText,
      note: r.note || '',
      callTime: r.callTime || r.createdAt,
      followUpDate: r.followUpDate || '',
      followUpTime: r.followUpTime || '',
    };
  });

  const payload: SyncPayload = {
    action: 'bulk_sync',
    timestamp: new Date().toISOString(),
    source: 'VietinBank_NinhBinh_CX400',
    data: {
      totalRecords: rows.length,
      records: rows,
    },
  };

  const res = await sendToGoogleSheetsWebhook(payload);
  return {
    success: res.success,
    count: rows.length,
    message: res.success
      ? `Đã đồng bộ thành công ${rows.length} lượt gọi lên Google Sheets.`
      : res.message,
  };
}

/**
 * Ping / Test connection to Webhook
 */
export async function testGoogleSheetsWebhook(url?: string): Promise<{ success: boolean; message: string }> {
  const payload: SyncPayload = {
    action: 'ping',
    timestamp: new Date().toISOString(),
    source: 'VietinBank_NinhBinh_CX400_ConnectionTest',
    data: {
      test: true,
      message: 'VietinBank Ninh Binh CX400 Ping Test',
    },
  };

  return sendToGoogleSheetsWebhook(payload, url);
}
