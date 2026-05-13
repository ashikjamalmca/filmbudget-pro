import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { LoginPage } from './components/LoginPage';
import { ProjectSelection } from './components/ProjectSelection';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardOverview } from './components/DashboardOverview';
import { DailyExpenseEntry } from './components/DailyExpenseEntry';
import { DailyExpenseComparison } from './components/DailyExpenseComparison';
import { RemunerationManagement } from './components/RemunerationManagement';
import { BudgetManagement } from './components/BudgetManagement';
import { Reports } from './components/Reports';
import { DocumentManagement } from './components/DocumentManagement';
import { UserManagement } from './components/UserManagement';
import { ProducerSettings } from './components/ProducerSettings';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

type AppState = 'login' | 'project-selection' | 'dashboard';

function TenantSuspendedScreen({ onLogout }: { onLogout: () => void }) {
  const { tenant, signOut } = useAuth();
  const handleLogout = async () => { await signOut(); onLogout(); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Suspended</h2>
        <p className="text-gray-500 mb-2">
          The workspace <strong>{tenant?.name}</strong> has been suspended.
        </p>
        {tenant?.suspension_reason && (
          <p className="text-sm text-gray-400 mb-4">Reason: {tenant.suspension_reason}</p>
        )}
        <p className="text-sm text-gray-400 mb-6">Please contact your platform administrator to resolve this.</p>
        <button onClick={handleLogout} className="text-sm text-[#1E3A8A] hover:underline">Sign out</button>
      </div>
    </div>
  );
}

function NoTenantScreen({ onLogout }: { onLogout: () => void }) {
  const { signOut } = useAuth();
  const handleLogout = async () => { await signOut(); onLogout(); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Workspace Not Assigned</h2>
        <p className="text-gray-500 mb-6">
          Your account is not linked to any production workspace yet. Please contact your administrator.
        </p>
        <button onClick={handleLogout} className="text-sm text-[#1E3A8A] hover:underline">Sign out</button>
      </div>
    </div>
  );
}

function AppInner() {
  const { session, loading, isSuperAdmin, tenantId, tenant } = useAuth();
  const [appState, setAppState] = useState<AppState>('login');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1E3A8A] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <LoginPage onLogin={() => {}} />;
  }

  // Super admin gets dedicated console
  if (isSuperAdmin) {
    return <SuperAdminDashboard onLogout={() => setAppState('login')} />;
  }

  // Regular user with no tenant assigned
  if (!tenantId) {
    return <NoTenantScreen onLogout={() => setAppState('login')} />;
  }

  // Tenant is suspended
  if (tenant && !tenant.is_active) {
    return <TenantSuspendedScreen onLogout={() => setAppState('login')} />;
  }

  // Normal tenant flow
  const effectiveState = appState === 'login' ? 'project-selection' : appState;

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setAppState('dashboard');
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentProjectId(null);
    setAppState('login');
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardOverview projectId={currentProjectId} />;
      case 'budget': return <BudgetManagement projectId={currentProjectId} />;
      case 'daily-expenses': return <DailyExpenseEntry projectId={currentProjectId} />;
      case 'expense-comparison': return <DailyExpenseComparison projectId={currentProjectId} />;
      case 'remuneration':
      case 'artists':
      case 'technicians':
      case 'song-bgm': return <RemunerationManagement projectId={currentProjectId} />;
      case 'reports': return <Reports projectId={currentProjectId} />;
      case 'documents': return <DocumentManagement projectId={currentProjectId} />;
      case 'users': return <UserManagement />;
      case 'settings': return <ProducerSettings />;
      default: return <DashboardOverview projectId={currentProjectId} />;
    }
  };

  if (effectiveState === 'project-selection') {
    return <ProjectSelection onSelectProject={handleProjectSelect} />;
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
      projectId={currentProjectId}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppInner />
      </ProjectProvider>
    </AuthProvider>
  );
}
