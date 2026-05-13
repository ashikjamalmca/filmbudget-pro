import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { LoginPage } from './components/LoginPage';
import { ProjectSelection } from './components/ProjectSelection';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardOverview } from './components/DashboardOverview';
import { DailyExpenseEntry } from './components/DailyExpenseEntry';
import { DailyExpenseComparison } from './components/DailyExpenseComparison';
import { ArtistsTechnicians } from './components/ArtistsTechnicians';
import { SongBGM } from './components/SongBGM';
import { Reports } from './components/Reports';
import { DocumentManagement } from './components/DocumentManagement';
import { UserManagement } from './components/UserManagement';

type AppState = 'login' | 'project-selection' | 'dashboard';

function AppInner() {
  const { session, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('login');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const effectiveState = session ? (appState === 'login' ? 'project-selection' : appState) : 'login';

  const handleLogin = () => setAppState('project-selection');

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
      case 'daily-expenses': return <DailyExpenseEntry projectId={currentProjectId} />;
      case 'expense-comparison': return <DailyExpenseComparison projectId={currentProjectId} />;
      case 'artists':
      case 'technicians': return <ArtistsTechnicians projectId={currentProjectId} activeTab={currentPage === 'technicians' ? 'technicians' : 'artists'} />;
      case 'song-bgm': return <SongBGM projectId={currentProjectId} />;
      case 'reports': return <Reports projectId={currentProjectId} />;
      case 'documents': return <DocumentManagement projectId={currentProjectId} />;
      case 'users': return <UserManagement />;
      default: return <DashboardOverview projectId={currentProjectId} />;
    }
  };

  if (effectiveState === 'login') return <LoginPage onLogin={handleLogin} />;

  if (effectiveState === 'project-selection') return <ProjectSelection onSelectProject={handleProjectSelect} />;

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
