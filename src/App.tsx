/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GymProvider } from './context/GymContext';
import { ToastProvider } from './components/common/Toast';
import { TopNavBar } from './components/layout/TopNavBar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { AppFooter } from './components/layout/AppFooter';

// Pages
import { PublicLanding } from './pages/PublicLanding';
import { AuthLogin } from './pages/AuthLogin';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { MembersManagement } from './pages/owner/MembersManagement';
import { MembershipPlans } from './pages/owner/MembershipPlans';
import { PaymentsManagement } from './pages/owner/PaymentsManagement';
import { AttendanceManagement } from './pages/owner/AttendanceManagement';
import { ExpiringMemberships } from './pages/owner/ExpiringMemberships';
import { ExpiredMemberships } from './pages/owner/ExpiredMemberships';
import { RenewalRequests } from './pages/owner/RenewalRequests';
import { ReportsPage } from './pages/owner/ReportsPage';
import { StaffManagement } from './pages/owner/StaffManagement';
import { ActivityLogsPage } from './pages/owner/ActivityLogsPage';
import { SettingsPage } from './pages/owner/SettingsPage';

// Modals
import { AssignMembershipModal } from './pages/owner/AssignMembershipModal';

const AppContent: React.FC = () => {
  const { currentUser, role, activeView } = useAuth();

  // Navigation tab for Owner & Staff
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Modal for quick assigning memberships
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // If user is on public landing page
  if (activeView === 'public') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#140b0a] text-slate-900 dark:text-[#fceae7] flex flex-col font-sans transition-colors duration-200">
        <TopNavBar />
        <main className="flex-1">
          <PublicLanding />
        </main>
      </div>
    );
  }

  // If user is on authentication gateway
  if (activeView === 'login' || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#140b0a] text-slate-900 dark:text-[#fceae7] flex flex-col font-sans transition-colors duration-200">
        <TopNavBar />
        <main className="flex-1">
          <AuthLogin />
        </main>
        <AppFooter />
      </div>
    );
  }

  // 1. CUSTOMER PORTAL
  if (role === 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#140b0a] text-slate-900 dark:text-[#fceae7] flex flex-col font-sans transition-colors duration-200">
        <TopNavBar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <CustomerPortal />
        </main>
        <AppFooter isPortal />
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    );
  }

  // 2. STAFF DESK EXPERIENCE
  if (role === 'STAFF') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#140b0a] text-slate-900 dark:text-[#fceae7] flex flex-col font-sans transition-colors duration-200">
        <TopNavBar />
        <div className="flex-1 flex w-full">
          <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-hidden">
              {currentTab === 'overview' && <StaffDashboard />}
              {currentTab === 'members' && <MembersManagement />}
              {currentTab === 'attendance' && (
                <AttendanceManagement onAssignMembership={() => setIsAssignModalOpen(true)} />
              )}
              {currentTab === 'expiring' && (
                <ExpiringMemberships onRenewMembership={() => setIsAssignModalOpen(true)} />
              )}
              {currentTab === 'expired' && (
                <ExpiredMemberships onRenewMembership={() => setIsAssignModalOpen(true)} />
              )}
              {currentTab === 'renewals' && <RenewalRequests />}
              {currentTab === 'payments' && <PaymentsManagement />}
            </main>
            <AppFooter isPortal />
          </div>
        </div>

        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

        <AssignMembershipModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
        />
      </div>
    );
  }

  // 3. OWNER EXECUTIVE PORTAL
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#140b0a] text-slate-900 dark:text-[#fceae7] flex flex-col font-sans transition-colors duration-200">
      <TopNavBar />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Dynamic Tab Views */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-hidden">
            {currentTab === 'overview' && (
              <OwnerDashboard 
                onNavigateTab={setCurrentTab}
                onOpenAddMember={() => setCurrentTab('members')}
                onOpenAssignPlan={() => setIsAssignModalOpen(true)}
              />
            )}
            {currentTab === 'members' && <MembersManagement />}
            {currentTab === 'plans' && <MembershipPlans />}
            {currentTab === 'payments' && <PaymentsManagement />}
            {currentTab === 'attendance' && (
              <AttendanceManagement onAssignMembership={() => setIsAssignModalOpen(true)} />
            )}
            {currentTab === 'expiring' && (
              <ExpiringMemberships onRenewMembership={() => setIsAssignModalOpen(true)} />
            )}
            {currentTab === 'expired' && (
              <ExpiredMemberships onRenewMembership={() => setIsAssignModalOpen(true)} />
            )}
            {currentTab === 'renewals' && <RenewalRequests />}
            {currentTab === 'reports' && <ReportsPage />}
            {currentTab === 'staff' && <StaffManagement />}
            {currentTab === 'audit' && <ActivityLogsPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </main>
          <AppFooter isPortal />
        </div>
      </div>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      <AssignMembershipModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <GymProvider>
            <AppContent />
          </GymProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
