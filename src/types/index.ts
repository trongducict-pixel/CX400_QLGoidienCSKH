export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  employeeId?: string;
  username: string;
  password?: string;
  fullName: string;
  email?: string;
  department?: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  title?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  sheetUrl?: string;
  webhookUrl: string; // Google Apps Script Web App URL for real-time live sync
  autoSync: boolean;
  lastSyncedAt?: string;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  syncError?: string;
  totalSyncedRecords?: number;
}

export type CampaignStatus = 'draft' | 'in_progress' | 'completed' | 'closed';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  script: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: CampaignStatus;
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt?: string;
}

export interface Customer {
  id: string;
  campaignId: string;
  stt: number;
  fullName: string;
  phone: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  campaignId: string;
  customerId: string;
  staffId: string;
  assignedAt: string;
}

export type CallStatus = 'not_contacted' | 'contacted' | 'cannot_contact';

export type CallResult = 
  | 'announced'          // Đã thông báo
  | 'interested'         // Khách hàng quan tâm
  | 'callback_requested' // Khách hàng đề nghị gọi lại
  | 'not_interested'     // Khách hàng không có nhu cầu
  | 'other';             // Khác

export interface CallRecord {
  id: string;
  campaignId: string;
  customerId: string;
  staffId: string;
  status: CallStatus;
  result?: CallResult;
  note?: string;
  callTime?: string;     // ISO timestamp or formatted
  followUpDate?: string; // YYYY-MM-DD
  followUpTime?: string; // HH:mm
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface ExcelCustomerRow {
  stt?: number | string;
  fullName: string;
  phone: string;
  error?: string;
  isDuplicate?: boolean;
}

export interface ExcelValidationResult {
  totalRows: number;
  validRows: ExcelCustomerRow[];
  missingPhoneRows: ExcelCustomerRow[];
  invalidPhoneRows: ExcelCustomerRow[];
  duplicatePhoneRows: ExcelCustomerRow[];
  isValid: boolean;
}
