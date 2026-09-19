import React, { useState } from 'react';
import { User, UserRole, Assignment } from '../types';
import { db } from '../services/storage';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Building2,
  UserCheck,
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  assignments: Assignment[];
  onDataUpdated: () => void;
}

export function UserManagement({
  currentUser,
  users,
  assignments,
  onDataUpdated,
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Reset Password Modal states
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('123456');

  // Form fields for create/edit
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [active, setActive] = useState(true);
  const [formPassword, setFormPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Compute customers assigned to each staff
  const staffCustomerCountMap = new Map<string, number>();
  assignments.forEach((a) => {
    staffCustomerCountMap.set(a.staffId, (staffCustomerCountMap.get(a.staffId) || 0) + 1);
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm.trim());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Open Edit modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsNewUser(false);
    setFullName(user.fullName);
    setUsername(user.username);
    setTitle(user.title || '');
    setEmail(user.email || `${user.username}@vietinbank.vn`);
    setPhone(user.phone || '');
    setRole(user.role);
    setActive(user.active);
    setFormPassword('');
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  // Open Create modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsNewUser(true);
    setFullName('');
    setUsername('');
    setTitle('Cán bộ CSKH');
    setEmail('');
    setPhone('');
    setRole('staff');
    setActive(true);
    setFormPassword('123456');
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  // Save User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ và tên và Mã cán bộ/Tên đăng nhập.');
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Check duplicate username if new
    if (isNewUser) {
      const existing = users.find((u) => u.username.toLowerCase() === trimmedUsername);
      if (existing) {
        setErrorMsg(`Tên đăng nhập / Mã cán bộ "${trimmedUsername}" đã tồn tại trên hệ thống.`);
        return;
      }
    }

    const userToSave: User = {
      id: editingUser?.id || `u-${trimmedUsername}-${Date.now()}`,
      username: trimmedUsername,
      fullName: fullName.trim(),
      title: title.trim() || undefined,
      email: email.trim() || `${trimmedUsername}@vietinbank.vn`,
      phone: phone.trim() || undefined,
      role,
      active,
      password: formPassword.trim() || editingUser?.password || '123456',
    };

    db.saveUser(userToSave, currentUser);
    onDataUpdated();
    setIsEditModalOpen(false);
    setSuccessNotice(
      isNewUser
        ? `Đã thêm cán bộ "${userToSave.fullName}" thành công.`
        : `Đã cập nhật thông tin cán bộ "${userToSave.fullName}".`
    );
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Open Reset Password modal
  const handleOpenResetPassword = (user: User) => {
    setTargetResetUser(user);
    setNewPassword('123456');
    setIsResetPasswordOpen(true);
  };

  // Confirm Reset Password
  const handleConfirmResetPassword = () => {
    if (!targetResetUser) return;
    if (!newPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới.');
      return;
    }

    db.resetUserPassword(targetResetUser.id, newPassword.trim(), currentUser);
    onDataUpdated();
    setIsResetPasswordOpen(false);
    setSuccessNotice(`Đã reset mật khẩu cho cán bộ "${targetResetUser.fullName}" thành công!`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Toggle active status
  const handleToggleActive = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Bạn không thể tự khóa tài khoản của chính mình!');
      return;
    }
    const updated = { ...user, active: !user.active };
    db.saveUser(updated, currentUser);
    onDataUpdated();
    setSuccessNotice(
      `Đã ${updated.active ? 'kích hoạt' : 'tạm khóa'} tài khoản "${user.fullName}".`
    );
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Delete user
  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Bạn không thể xóa tài khoản của chính mình!');
      return;
    }
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa tài khoản cán bộ "${user.fullName}" (${user.username}) không?`
      )
    ) {
      db.deleteUser(user.id, currentUser);
      onDataUpdated();
      setSuccessNotice(`Đã xóa tài khoản "${user.fullName}".`);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const staffCount = users.filter((u) => u.role === 'staff').length;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 text-[#BE1E2D]">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản trị người dùng & Phân quyền cán bộ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Quản lý danh sách nhân sự Phòng DVKH, phân quyền Lãnh đạo / Cán bộ, chỉnh sửa thông tin & reset mật khẩu
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-900/10 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ THÊM CÁN BỘ MỚI</span>
        </button>
      </div>

      {/* Success banner */}
      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Tổng nhân sự</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tài khoản trên hệ thống</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Lãnh đạo phòng</div>
          <div className="text-2xl font-black text-[#BE1E2D] mt-1">{adminCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Quyền Quản trị Admin</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Cán bộ CSKH</div>
          <div className="text-2xl font-black text-[#003B70] mt-1">{staffCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Thực hiện gọi điện</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Đang hoạt động</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sẵn sàng phân công</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã cán bộ, chức vụ, email hoặc SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#BE1E2D]"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'admin', label: 'Lãnh đạo (Admin)' },
            { id: 'staff', label: 'Cán bộ (Staff)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                roleFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-5 py-3.5">Họ và tên & Chức danh</th>
                <th className="px-4 py-3.5">Mã CB / Tên đăng nhập</th>
                <th className="px-4 py-3.5">Liên hệ</th>
                <th className="px-4 py-3.5 text-center">Phân quyền</th>
                <th className="px-4 py-3.5 text-center">Đang phụ trách</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const assignedCount = staffCustomerCountMap.get(user.id) || 0;
                  const isCurrent = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{user.fullName}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-red-100 text-[#BE1E2D] font-extrabold px-1.5 py-0.5 rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{user.title || 'Cán bộ'}</div>
                      </td>

                      <td className="px-4 py-4 font-mono font-bold text-slate-800">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">
                          {user.username}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">
                            {user.email || `${user.username}@vietinbank.vn`}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-[#BE1E2D] border border-red-200">
                            <Shield className="w-3 h-3" />
                            Lãnh đạo (Admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#003B70] border border-blue-200">
                            <UserCheck className="w-3 h-3" />
                            Cán bộ (Staff)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {user.role === 'staff' ? (
                          <span className="font-extrabold text-slate-900 text-sm">
                            {assignedCount} <span className="text-[10px] text-slate-400 font-normal">KH</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          disabled={isCurrent}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isCurrent ? 'Không thể khóa tài khoản của chính mình' : 'Bấm để đổi trạng thái'}
                        >
                          {user.active ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{user.active ? 'Hoạt động' : 'Tạm khóa'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Sửa thông tin */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
                            title="Chỉnh sửa thông tin cán bộ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset mật khẩu */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(user)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors"
                            title="Reset mật khẩu"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa tài khoản (chỉ khi không phải chính mình) */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 transition-colors"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CHỈNH SỬA / THÊM MỚI NGƯỜI DÙNG */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#BE1E2D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="text-base font-bold">
                  {isNewUser ? 'THÊM MỚI CÁN BỘ DVKH' : 'CHỈNH SỬA THÔNG TIN CÁN BỘ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Họ và tên <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#BE1E2D]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Mã CB / Tên đăng nhập <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNewUser}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: cb06"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#BE1E2D] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Chức danh
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Cán bộ CSKH"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#BE1E2D]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0988123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#BE1E2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Email công vụ (@vietinbank.vn)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="canbo@vietinbank.vn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#BE1E2D]"
                />
              </div>

              {/* Phân quyền vai trò (RBAC) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-800 font-bold uppercase tracking-wider mb-2">
                  Phân quyền vai trò (Role):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col transition-all ${
                      role === 'staff'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="userRole"
                        checked={role === 'staff'}
                        onChange={() => setRole('staff')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Cán bộ CSKH (Staff)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 font-normal">
                      Chỉ xem & gọi điện cho các khách hàng được phân công
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col transition-all ${
                      role === 'admin'
                        ? 'border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="userRole"
                        checked={role === 'admin'}
                        onChange={() => setRole('admin')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>Lãnh đạo phòng (Admin)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 font-normal">
                      Toàn quyền tạo chiến dịch, phân công, báo cáo & phân quyền
                    </span>
                  </label>
                </div>
              </div>

              {/* Trạng thái hoạt động */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-800">Trạng thái tài khoản:</div>
                  <div className="text-[11px] text-slate-500">Cho phép cán bộ đăng nhập vào hệ thống</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {isNewUser && (
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mặc định: 123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#BE1E2D]"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#BE1E2D] hover:bg-[#a61825] text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  {isNewUser ? 'TẠO CÁN BỘ' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET MẬT KHẨU */}
      {isResetPasswordOpen && targetResetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 border-b border-slate-100 pb-3">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">CẤP LẠI MẬT KHẨU</h3>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-600">
                Đặt lại mật khẩu cho cán bộ{' '}
                <strong className="text-slate-900">{targetResetUser.fullName}</strong> (Mã:{' '}
                <code className="font-bold text-slate-800">{targetResetUser.username}</code>):
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Khuyến nghị: 123456 hoặc cấp theo quy chuẩn bảo mật chi nhánh
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetPasswordOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                XÁC NHẬN RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
