import {
  User,
  Campaign,
  Customer,
  Assignment,
  CallRecord,
  ActivityLog,
  CallStatus,
  CallResult,
  GoogleSheetsConfig,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'cx400_users',
  CAMPAIGNS: 'cx400_campaigns',
  CUSTOMERS: 'cx400_customers',
  ASSIGNMENTS: 'cx400_assignments',
  CALL_RECORDS: 'cx400_call_records',
  ACTIVITY_LOGS: 'cx400_activity_logs',
  CURRENT_USER: 'cx400_current_user',
};

// Default seed users
const INITIAL_USERS: User[] = [
  {
    id: 'u-admin',
    username: 'admin',
    password: '123456',
    fullName: 'Nguyễn Thu Hương',
    title: 'Trưởng phòng DVKH',
    role: 'admin',
    active: true,
    phone: '0912345678',
  },
  {
    id: 'u-cb01',
    username: 'cb01',
    password: '123456',
    fullName: 'Nguyễn Văn A',
    title: 'Cán bộ CSKH',
    role: 'staff',
    active: true,
    phone: '0988111222',
  },
  {
    id: 'u-cb02',
    username: 'cb02',
    password: '123456',
    fullName: 'Trần Thị B',
    title: 'Cán bộ CSKH',
    role: 'staff',
    active: true,
    phone: '0977222333',
  },
  {
    id: 'u-cb03',
    username: 'cb03',
    password: '123456',
    fullName: 'Lê Văn C',
    title: 'Cán bộ CSKH',
    role: 'staff',
    active: true,
    phone: '0911333444',
  },
  {
    id: 'u-cb04',
    username: 'cb04',
    password: '123456',
    fullName: 'Phạm Thị D',
    title: 'Cán bộ CSKH',
    role: 'staff',
    active: true,
    phone: '0933444555',
  },
  {
    id: 'u-cb05',
    username: 'cb05',
    password: '123456',
    fullName: 'Hoàng Thị E',
    title: 'Cán bộ CSKH',
    role: 'staff',
    active: true,
    phone: '0966555666',
  },
];

// Seed initial campaigns
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-01',
    name: 'Chăm sóc khách hàng tiền gửi tháng 09/2026',
    description: 'Chiến dịch tư vấn gói tiền gửi tiết kiệm ưu đãi và tri ân khách hàng đến hạn tái tục.',
    script: 'Kính chào Quý khách! Em là [Tên cán bộ], gọi điện từ VietinBank Chi nhánh Ninh Bình - Phòng Dịch vụ khách hàng. Em xin phép thông báo tới Quý khách về chương trình tiền gửi tiết kiệm lãi suất ưu đãi đặc biệt tháng 09/2026 với nhiều quà tặng tri ân hấp dẫn và tư vấn sản phẩm phù hợp nhất với kế hoạch tài chính của Quý khách ạ.',
    startDate: '2026-09-20',
    endDate: '2026-09-30',
    status: 'in_progress',
    createdBy: 'u-admin',
    createdAt: '2026-09-18T08:00:00.000Z',
  },
  {
    id: 'cmp-02',
    name: 'Thông báo chương trình ưu đãi dịch vụ VietinBank iPay',
    description: 'Chương trình giới thiệu tiện ích thanh toán hóa đơn tự động và hoàn tiền trên ngân hàng số iPay.',
    script: 'Dạ em chào Quý khách! Em là cán bộ Phòng DVKH VietinBank Ninh Bình. Em xin thông báo gói ưu đãi hoàn tiền 10% khi giao dịch hóa đơn điện nước trên VietinBank iPay tháng này và hướng dẫn Quý khách kích hoạt nhanh chóng ngay trên điện thoại.',
    startDate: '2026-09-15',
    endDate: '2026-09-28',
    status: 'in_progress',
    createdBy: 'u-admin',
    createdAt: '2026-09-15T09:00:00.000Z',
  },
  {
    id: 'cmp-03',
    name: 'Chăm sóc khách hàng định kỳ Quý III/2026',
    description: 'Khảo sát mức độ hài lòng về chất lượng phục vụ tại quầy giao dịch VietinBank Ninh Bình.',
    script: 'Kính chào Quý khách! VietinBank Ninh Bình xin gửi lời tri ân sâu sắc vì Quý khách đã luôn đồng hành. Em xin phép được lắng nghe 1-2 ý kiến đóng góp của Quý khách về trải nghiệm giao dịch gần đây để chúng em phục vụ ngày một tốt hơn ạ.',
    startDate: '2026-09-01',
    endDate: '2026-09-18', // Expired to trigger past-date warning!
    status: 'completed',
    createdBy: 'u-admin',
    createdAt: '2026-09-01T08:30:00.000Z',
  },
];

// Generate sample customers
const SAMPLE_CUSTOMER_DATA = [
  { name: 'Nguyễn Văn Nam', phone: '0988123456' },
  { name: 'Trần Thị Mai', phone: '0978234567' },
  { name: 'Lê Hoàng Long', phone: '0918345678' },
  { name: 'Phạm Minh Tuấn', phone: '0903456789' },
  { name: 'Vũ Thị Kim Oanh', phone: '0965567890' },
  { name: 'Đỗ Quang Huy', phone: '0942678901' },
  { name: 'Bùi Thu Trang', phone: '0936789012' },
  { name: 'Ngô Thanh Tùng', phone: '0924890123' },
  { name: 'Hoàng Ánh Tuyết', phone: '0981901234' },
  { name: 'Dương Đình Trọng', phone: '0973012345' },
  { name: 'Trịnh Thúy Hằng', phone: '0912123789' },
  { name: 'Đặng Ngọc Lan', phone: '0983234890' },
  { name: 'Lý Quốc Bảo', phone: '0974345901' },
  { name: 'Võ Thị Thanh Thảo', phone: '0905456012' },
  { name: 'Phan Văn Hậu', phone: '0966567123' },
  { name: 'Cao Thị Diệu Linh', phone: '0947678234' },
  { name: 'Tạ Đức Anh', phone: '0938789345' },
  { name: 'Hồ Quỳnh Nga', phone: '0929890456' },
  { name: 'Đinh Tiến Đạt', phone: '0980901567' },
  { name: 'Chu Thị Mỹ Hạnh', phone: '0971012678' },
  { name: 'Lương Hoài Nam', phone: '0915123890' },
  { name: 'Mai Văn Toàn', phone: '0984234901' },
  { name: 'Trần Đình Trọng', phone: '0975345012' },
  { name: 'Nguyễn Thị Bích Ngọc', phone: '0906456123' },
  { name: 'Lê Hồng Phong', phone: '0967567234' },
];

function generateSeedData() {
  const customers: Customer[] = [];
  const assignments: Assignment[] = [];
  const callRecords: CallRecord[] = [];
  const activityLogs: ActivityLog[] = [];

  const staffList = INITIAL_USERS.filter((u) => u.role === 'staff');

  // Campaign 1 customers: 25 customers distributed across 5 staff (5 each)
  SAMPLE_CUSTOMER_DATA.forEach((item, idx) => {
    const custId = `cust-c1-${idx + 1}`;
    const staff = staffList[idx % staffList.length];

    customers.push({
      id: custId,
      campaignId: 'cmp-01',
      stt: idx + 1,
      fullName: item.name,
      phone: item.phone,
      createdAt: '2026-09-18T08:30:00.000Z',
    });

    assignments.push({
      id: `asg-c1-${idx + 1}`,
      campaignId: 'cmp-01',
      customerId: custId,
      staffId: staff.id,
      assignedAt: '2026-09-18T09:00:00.000Z',
    });

    // Create diverse sample calling statuses
    if (idx < 8) {
      // Contacted & completed
      const results: CallResult[] = ['announced', 'interested', 'not_interested', 'announced', 'interested', 'announced', 'other', 'announced'];
      const notes = [
        'KH đã nắm được thông tin, dự kiến cuối tuần ra quầy gửi 500tr.',
        'KH rất quan tâm chương trình, đã tư vấn kỳ hạn 6 tháng.',
        'KH hiện chưa có nhu cầu gửi thêm, vẫn dùng tài khoản bình thường.',
        'Đã thông báo chi tiết quà tặng hiện vật.',
        'KH quan tâm sản phẩm tích lũy cho con.',
        'Đã tư vấn qua điện thoại, KH cảm ơn.',
        'KH hỏi thêm thủ tục chuyển đổi sổ tiết kiệm online.',
        'Đã thông báo biểu lãi suất mới nhất.',
      ];
      callRecords.push({
        id: `call-c1-${idx + 1}`,
        campaignId: 'cmp-01',
        customerId: custId,
        staffId: staff.id,
        status: 'contacted',
        result: results[idx],
        note: notes[idx],
        callTime: '2026-09-19 09:15',
        createdAt: '2026-09-19T02:15:00.000Z',
      });
      activityLogs.push({
        id: `act-${idx + 1}`,
        userId: staff.id,
        userName: staff.fullName,
        action: 'Cập nhật cuộc gọi',
        target: item.name,
        details: `Trạng thái: Chưa liên hệ → Đã liên hệ | Kết quả: ${results[idx]} | Ghi chú: ${notes[idx]}`,
        timestamp: '2026-09-19 09:15',
      });
    } else if (idx >= 8 && idx < 11) {
      // Callback requested
      const followUpDates = ['2026-09-21', '2026-09-22', '2026-09-20'];
      const followUpTimes = ['14:30', '10:00', '16:00'];
      const notes = [
        'KH đang bận họp, hẹn gọi lại lúc 14h30 ngày 21/09.',
        'KH đang lái xe đường dài, dặn gọi lại vào buổi sáng.',
        'KH nhờ tư vấn lại cụ thể mức lãi suất 12 tháng.',
      ];
      callRecords.push({
        id: `call-c1-${idx + 1}`,
        campaignId: 'cmp-01',
        customerId: custId,
        staffId: staff.id,
        status: 'contacted',
        result: 'callback_requested',
        note: notes[idx - 8],
        followUpDate: followUpDates[idx - 8],
        followUpTime: followUpTimes[idx - 8],
        callTime: '2026-09-19 10:20',
        createdAt: '2026-09-19T03:20:00.000Z',
      });
      activityLogs.push({
        id: `act-${idx + 1}`,
        userId: staff.id,
        userName: staff.fullName,
        action: 'Hẹn lịch gọi lại',
        target: item.name,
        details: `Đã liên hệ → Khách đề nghị gọi lại lúc ${followUpTimes[idx - 8]} ngày ${followUpDates[idx - 8]}. Ghi chú: ${notes[idx - 8]}`,
        timestamp: '2026-09-19 10:20',
      });
    } else if (idx >= 11 && idx < 14) {
      // Cannot contact
      const notes = ['Máy bận, không nhấc máy', 'Thuê bao không liên lạc được', 'Tắt máy sau 3 hồi chuông'];
      callRecords.push({
        id: `call-c1-${idx + 1}`,
        campaignId: 'cmp-01',
        customerId: custId,
        staffId: staff.id,
        status: 'cannot_contact',
        note: notes[idx - 11],
        callTime: '2026-09-19 11:00',
        createdAt: '2026-09-19T04:00:00.000Z',
      });
      activityLogs.push({
        id: `act-${idx + 1}`,
        userId: staff.id,
        userName: staff.fullName,
        action: 'Cập nhật cuộc gọi',
        target: item.name,
        details: `Trạng thái: Chưa liên hệ → Không liên hệ được (${notes[idx - 11]})`,
        timestamp: '2026-09-19 11:00',
      });
    } else {
      // Remaining are not contacted yet (status: 'not_contacted')
      callRecords.push({
        id: `call-c1-${idx + 1}`,
        campaignId: 'cmp-01',
        customerId: custId,
        staffId: staff.id,
        status: 'not_contacted',
        createdAt: '2026-09-18T09:00:00.000Z',
      });
    }
  });

  // Campaign 2 customers: 10 customers
  SAMPLE_CUSTOMER_DATA.slice(0, 10).forEach((item, idx) => {
    const custId = `cust-c2-${idx + 1}`;
    const staff = staffList[idx % 3];
    customers.push({
      id: custId,
      campaignId: 'cmp-02',
      stt: idx + 1,
      fullName: item.name,
      phone: item.phone,
      createdAt: '2026-09-15T09:30:00.000Z',
    });
    assignments.push({
      id: `asg-c2-${idx + 1}`,
      campaignId: 'cmp-02',
      customerId: custId,
      staffId: staff.id,
      assignedAt: '2026-09-15T10:00:00.000Z',
    });
    callRecords.push({
      id: `call-c2-${idx + 1}`,
      campaignId: 'cmp-02',
      customerId: custId,
      staffId: staff.id,
      status: idx < 4 ? 'contacted' : 'not_contacted',
      result: idx < 4 ? 'announced' : undefined,
      note: idx < 4 ? 'KH đã cài đặt iPay và nhận hướng dẫn' : undefined,
      callTime: idx < 4 ? '2026-09-16 14:00' : undefined,
      createdAt: '2026-09-15T10:00:00.000Z',
    });
  });

  // Campaign 3 customers: 8 customers, all completed
  SAMPLE_CUSTOMER_DATA.slice(0, 8).forEach((item, idx) => {
    const custId = `cust-c3-${idx + 1}`;
    const staff = staffList[idx % 2];
    customers.push({
      id: custId,
      campaignId: 'cmp-03',
      stt: idx + 1,
      fullName: item.name,
      phone: item.phone,
      createdAt: '2026-09-01T09:00:00.000Z',
    });
    assignments.push({
      id: `asg-c3-${idx + 1}`,
      campaignId: 'cmp-03',
      customerId: custId,
      staffId: staff.id,
      assignedAt: '2026-09-01T09:30:00.000Z',
    });
    callRecords.push({
      id: `call-c3-${idx + 1}`,
      campaignId: 'cmp-03',
      customerId: custId,
      staffId: staff.id,
      status: 'contacted',
      result: 'announced',
      note: 'Khảo sát hoàn tất, KH hài lòng với thái độ phục vụ.',
      callTime: '2026-09-10 15:30',
      createdAt: '2026-09-01T09:30:00.000Z',
    });
  });

  activityLogs.unshift({
    id: 'act-init',
    userId: 'u-admin',
    userName: 'Nguyễn Thu Hương',
    action: 'Khởi tạo chiến dịch',
    target: 'Chăm sóc khách hàng tiền gửi tháng 09/2026',
    details: 'Nhập 25 khách hàng và phân chia tự động cho 5 cán bộ',
    timestamp: '2026-09-18 09:00',
  });

  return { customers, assignments, callRecords, activityLogs };
}

// Database helper functions
export const db = {
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAMPAIGNS)) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      const seed = generateSeedData();
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seed.customers));
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(seed.assignments));
      localStorage.setItem(STORAGE_KEYS.CALL_RECORDS, JSON.stringify(seed.callRecords));
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(seed.activityLogs));
    }
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEYS.CALL_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    this.init();
  },

  // USERS
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getUserByUsername(username: string): User | undefined {
    return this.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  saveUser(user: User, adminUser?: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    const isNew = idx < 0;

    if (idx >= 0) {
      // Preserve existing password if not provided
      if (!user.password && users[idx].password) {
        user.password = users[idx].password;
      }
      users[idx] = user;
    } else {
      if (!user.password) {
        user.password = '123456'; // Default password
      }
      users.push(user);
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // If current logged-in user was modified, update their session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }

    if (adminUser) {
      this.addActivityLog({
        userId: adminUser.id,
        userName: adminUser.fullName,
        action: isNew ? 'Thêm cán bộ mới' : 'Cập nhật thông tin cán bộ',
        target: `${user.fullName} (${user.username})`,
        details: `Vai trò: ${user.role === 'admin' ? 'Lãnh đạo' : 'Cán bộ'} | Chức danh: ${user.title || 'N/A'} | Trạng thái: ${user.active ? 'Hoạt động' : 'Tạm khóa'}`,
      });
    }
  },

  resetUserPassword(userId: string, newPassword: string, adminUser: User): void {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    target.password = newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addActivityLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      action: 'Reset mật khẩu cán bộ',
      target: `${target.fullName} (${target.username})`,
      details: `Đã cấp lại mật khẩu mới cho tài khoản ${target.username}`,
    });
  },

  deleteUser(userId: string, adminUser: User): void {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const filtered = users.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

    this.addActivityLog({
      userId: adminUser.id,
      userName: adminUser.fullName,
      action: 'Xóa tài khoản cán bộ',
      target: `${target.fullName} (${target.username})`,
      details: `Đã xóa tài khoản khỏi hệ thống`,
    });
  },

  // CAMPAIGNS
  getCampaigns(): Campaign[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return raw ? JSON.parse(raw) : [];
  },

  getCampaignById(id: string): Campaign | undefined {
    return this.getCampaigns().find((c) => c.id === id);
  },

  saveCampaign(campaign: Campaign, logUser?: User): void {
    const campaigns = this.getCampaigns();
    const idx = campaigns.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) {
      campaigns[idx] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));

    if (logUser) {
      this.addActivityLog({
        userId: logUser.id,
        userName: logUser.fullName,
        action: idx >= 0 ? 'Cập nhật chiến dịch' : 'Tạo mới chiến dịch',
        target: campaign.name,
        details: `Trạng thái: ${campaign.status} | Thời gian: ${campaign.startDate} - ${campaign.endDate}`,
      });
    }
  },

  deleteCampaign(id: string, logUser?: User): void {
    const campaigns = this.getCampaigns();
    const target = campaigns.find((c) => c.id === id);
    const updated = campaigns.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));

    // Also remove customers, assignments, call records of this campaign
    const customers = this.getCustomers().filter((c) => c.campaignId !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    const assignments = this.getAssignments().filter((a) => a.campaignId !== id);
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));

    const calls = this.getCallRecords().filter((cr) => cr.campaignId !== id);
    localStorage.setItem(STORAGE_KEYS.CALL_RECORDS, JSON.stringify(calls));

    if (logUser && target) {
      this.addActivityLog({
        userId: logUser.id,
        userName: logUser.fullName,
        action: 'Xóa chiến dịch',
        target: target.name,
        details: `Đã xóa chiến dịch ID ${id}`,
      });
    }
  },

  // CUSTOMERS
  getCustomers(campaignId?: string): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const all: Customer[] = raw ? JSON.parse(raw) : [];
    if (campaignId) {
      return all.filter((c) => c.campaignId === campaignId);
    }
    return all;
  },

  saveCustomers(newCustomers: Customer[]): void {
    const all = this.getCustomers();
    all.push(...newCustomers);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(all));
  },

  // ASSIGNMENTS
  getAssignments(campaignId?: string): Assignment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    const all: Assignment[] = raw ? JSON.parse(raw) : [];
    if (campaignId) {
      return all.filter((a) => a.campaignId === campaignId);
    }
    return all;
  },

  saveAssignments(newAssignments: Assignment[]): void {
    const all = this.getAssignments();
    // Replace if customer already assigned in this campaign
    const updated = all.filter(
      (a) => !newAssignments.some((na) => na.campaignId === a.campaignId && na.customerId === a.customerId)
    );
    updated.push(...newAssignments);
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  },

  // CALL RECORDS
  getCallRecords(campaignId?: string): CallRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_RECORDS);
    const all: CallRecord[] = raw ? JSON.parse(raw) : [];
    if (campaignId) {
      return all.filter((cr) => cr.campaignId === campaignId);
    }
    return all;
  },

  saveCallRecord(
    record: {
      campaignId: string;
      customerId: string;
      staffId: string;
      status: CallStatus;
      result?: CallResult;
      note?: string;
      followUpDate?: string;
      followUpTime?: string;
    },
    user: User,
    customerName: string
  ): void {
    const records = this.getCallRecords();
    const existingIndex = records.findIndex(
      (r) => r.campaignId === record.campaignId && r.customerId === record.customerId
    );

    const nowFormatted = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const oldStatus = existingIndex >= 0 ? records[existingIndex].status : 'not_contacted';

    const newRecord: CallRecord = {
      id: existingIndex >= 0 ? records[existingIndex].id : `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      campaignId: record.campaignId,
      customerId: record.customerId,
      staffId: record.staffId,
      status: record.status,
      result: record.result,
      note: record.note,
      followUpDate: record.followUpDate,
      followUpTime: record.followUpTime,
      callTime: record.status !== 'not_contacted' ? nowFormatted : undefined,
      createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }
    localStorage.setItem(STORAGE_KEYS.CALL_RECORDS, JSON.stringify(records));

    // Audit log
    const statusMap: Record<CallStatus, string> = {
      not_contacted: 'Chưa liên hệ',
      contacted: 'Đã liên hệ',
      cannot_contact: 'Không liên hệ được',
    };
    const resultMap: Record<CallResult, string> = {
      announced: 'Đã thông báo',
      interested: 'Khách hàng quan tâm',
      callback_requested: 'Khách hàng đề nghị gọi lại',
      not_interested: 'Khách hàng không có nhu cầu',
      other: 'Khác',
    };

    const detailsParts = [
      `Trạng thái: ${statusMap[oldStatus]} → ${statusMap[record.status]}`,
    ];
    if (record.result) {
      detailsParts.push(`Kết quả: ${resultMap[record.result]}`);
    }
    if (record.followUpDate) {
      detailsParts.push(`Hẹn gọi lại: ${record.followUpTime || ''} ${record.followUpDate}`);
    }
    if (record.note) {
      detailsParts.push(`Ghi chú: ${record.note}`);
    }

    this.addActivityLog({
      userId: user.id,
      userName: user.fullName,
      action: 'Cập nhật cuộc gọi',
      target: customerName,
      details: detailsParts.join(' | '),
    });
  },

  // ACTIVITY LOGS
  getActivityLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    return raw ? JSON.parse(raw) : [];
  },

  addActivityLog(entry: {
    userId: string;
    userName: string;
    action: string;
    target: string;
    details: string;
  }): void {
    const logs = this.getActivityLogs();
    const now = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: entry.userId,
      userName: entry.userName,
      action: entry.action,
      target: entry.target,
      details: entry.details,
      timestamp: now,
    };
    logs.unshift(newLog);
    // Keep last 300 logs
    if (logs.length > 300) logs.length = 300;
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  },
};

// Initialize DB on first load
db.init();
