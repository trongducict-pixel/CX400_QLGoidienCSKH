import React, { useState, useEffect, useCallback } from 'react';
import { User, Campaign, Customer, Assignment, CallRecord, ActivityLog } from './types';
import { db } from './services/storage';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginView } from './pages/LoginView';
import { AdminDashboard } from './pages/AdminDashboard';
import { CampaignList } from './pages/CampaignList';
import { CampaignDetailView } from './pages/CampaignDetailView';
import { CreateCampaignModal } from './pages/CreateCampaignModal';
import { StaffCallingView } from './pages/StaffCallingView';
import { StaffCustomerList } from './pages/StaffCustomerList';
import { FollowUpList } from './pages/FollowUpList';
import { ActivityLogView } from './pages/ActivityLogView';
import { UserManagement } from './pages/UserManagement';

export default function App() {
  // Current logged in user (starts from persistent storage)
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
    currentUser?.role === 'staff' ? 'staff_call' : 'dashboard'
  );

  // Selected campaign for detail view
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Modal for campaign creation
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  // Target customer ID when jumping directly to calling view
  const [callingCustomerId, setCallingCustomerId] = useState<string | null>(null);

  // Database entities in state
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Function to load/reload all data from storage
  const loadData = useCallback(() => {
    setUsers(db.getUsers());
    setCampaigns(db.getCampaigns());
    setCustomers(db.getCustomers());
    setAssignments(db.getAssignments());
    setCallRecords(db.getCallRecords());
    setActivityLogs(db.getActivityLogs());
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle user change (login / logout / switch)
  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setActiveTab(user.role === 'staff' ? 'staff_call' : 'dashboard');
    }
    setSelectedCampaignId(null);
    loadData();
  };

  // Reset database to initial seed data
  const handleResetData = () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn khôi phục dữ liệu mẫu ban đầu của VietinBank Chi nhánh Ninh Bình không?'
      )
    ) {
      db.resetDemoData();
      loadData();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  // Switch to calling a specific customer
  const handleCallCustomer = (customerId: string, campaignId: string) => {
    setCallingCustomerId(customerId);
    setActiveTab('staff_call');
  };

  // Handle campaign created
  const handleCampaignCreated = (newCampaignId: string) => {
    loadData();
    setIsCreateCampaignOpen(false);
    setSelectedCampaignId(newCampaignId);
    setActiveTab('campaigns');
  };

  // Calculate callback count for current user
  const callbackCount = callRecords.filter((r) => {
    const isCallback = r.result === 'callback_requested' || !!r.followUpDate;
    if (!isCallback) return false;
    if (currentUser?.role === 'staff') {
      return r.staffId === currentUser.id;
    }
    return true;
  }).length;

  // Staff users list (excluding admin)
  const staffUsers = users.filter((u) => u.role === 'staff');

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleUserChange} />;
  }

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const isStaff = currentUser.role === 'staff';
  const canManageCampaigns = isAdmin || isManager;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sticky Header with branding and quick user switcher */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onResetData={handleResetData}
        callbackCount={callbackCount}
      />

      {/* Main Layout: Sidebar + Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            // If selecting campaigns tab, reset selected campaign to see full list
            if (tab === 'campaigns') {
              setSelectedCampaignId(null);
            }
          }}
          callbackCount={callbackCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          {/* DASHBOARD (Admin & Trưởng/Phó phòng) */}
          {canManageCampaigns && activeTab === 'dashboard' && (
            <AdminDashboard
              campaigns={campaigns}
              customers={customers}
              callRecords={callRecords}
              staffUsers={staffUsers}
              onCreateCampaign={() => setIsCreateCampaignOpen(true)}
              onViewCampaignDetail={(cmpId) => {
                setSelectedCampaignId(cmpId);
                setActiveTab('campaigns');
              }}
              onViewCallbacks={() => setActiveTab('callbacks')}
            />
          )}

          {/* CAMPAIGN LIST / CAMPAIGN DETAIL (Admin & Trưởng/Phó phòng manage, Staff views assigned) */}
          {activeTab === 'campaigns' && (
            <>
              {selectedCampaignId ? (
                <CampaignDetailView
                  campaignId={selectedCampaignId}
                  campaigns={campaigns}
                  customers={customers}
                  assignments={assignments}
                  callRecords={callRecords}
                  staffUsers={staffUsers}
                  activityLogs={activityLogs}
                  currentUser={currentUser}
                  onBack={() => setSelectedCampaignId(null)}
                  onDeleteCampaign={() => {
                    setSelectedCampaignId(null);
                    loadData();
                  }}
                  onCampaignUpdated={loadData}
                  onUpdateCampaignStatus={(status) => {
                    const cmp = campaigns.find((c) => c.id === selectedCampaignId);
                    if (cmp) {
                      db.saveCampaign({ ...cmp, status }, currentUser);
                      loadData();
                    }
                  }}
                />
              ) : (
                <CampaignList
                  campaigns={campaigns}
                  customers={customers}
                  callRecords={callRecords}
                  isAdmin={canManageCampaigns}
                  currentUser={currentUser}
                  onCreateCampaign={() => setIsCreateCampaignOpen(true)}
                  onViewCampaignDetail={(cmpId) => setSelectedCampaignId(cmpId)}
                  onDataUpdated={loadData}
                />
              )}
            </>
          )}

          {/* STAFF: DIRECT CALLING WORKFLOW (Chỉ nhân viên tiếp nhận & gọi điện) */}
          {(isStaff || activeTab === 'staff_call') && activeTab === 'staff_call' && (
            <StaffCallingView
              currentUser={currentUser}
              campaigns={campaigns}
              customers={customers}
              assignments={assignments}
              callRecords={callRecords}
              initialCustomerId={callingCustomerId}
              onDataUpdated={loadData}
              onViewCallbacks={() => setActiveTab('callbacks')}
            />
          )}

          {/* CUSTOMERS LIST (Staff xem khách hàng được phân công; Admin/Lãnh đạo xem toàn bộ KH chi nhánh) */}
          {activeTab === 'customers' && (
            <StaffCustomerList
              currentUser={currentUser}
              campaigns={campaigns}
              customers={customers}
              assignments={assignments}
              callRecords={callRecords}
              onCallCustomer={handleCallCustomer}
            />
          )}

          {/* CALLBACKS / FOLLOW-UP REMINDERS */}
          {activeTab === 'callbacks' && (
            <FollowUpList
              currentUser={currentUser}
              campaigns={campaigns}
              customers={customers}
              assignments={assignments}
              callRecords={callRecords}
              staffUsers={staffUsers}
              onCallCustomer={handleCallCustomer}
              onDataUpdated={loadData}
            />
          )}

          {/* REPORTS / EXCEL EXPORT (Admin & Trưởng/Phó phòng) */}
          {canManageCampaigns && activeTab === 'reports' && (
            <CampaignList
              campaigns={campaigns}
              customers={customers}
              callRecords={callRecords}
              isAdmin={canManageCampaigns}
              currentUser={currentUser}
              onCreateCampaign={() => setIsCreateCampaignOpen(true)}
              onViewCampaignDetail={(cmpId) => {
                setSelectedCampaignId(cmpId);
                setActiveTab('campaigns');
              }}
              onDataUpdated={loadData}
            />
          )}

          {/* USER MANAGEMENT & RBAC (CHỈ DÀNH RIÊNG CHO ADMIN TOÀN QUYỀN) */}
          {isAdmin && activeTab === 'users' && (
            <UserManagement
              currentUser={currentUser}
              users={users}
              assignments={assignments}
              onDataUpdated={loadData}
            />
          )}

          {/* ACTIVITY LOGS (Admin & Trưởng/Phó phòng) */}
          {canManageCampaigns && activeTab === 'logs' && (
            <ActivityLogView activityLogs={activityLogs} />
          )}
        </main>
      </div>

      {/* CREATE CAMPAIGN WIZARD MODAL */}
      {isCreateCampaignOpen && (
        <CreateCampaignModal
          currentUser={currentUser}
          staffUsers={staffUsers}
          onClose={() => setIsCreateCampaignOpen(false)}
          onSuccess={handleCampaignCreated}
        />
      )}
    </div>
  );
}
