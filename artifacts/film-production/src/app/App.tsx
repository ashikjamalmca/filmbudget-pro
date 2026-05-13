import React, { useState } from 'react';
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

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = () => {
    setAppState('project-selection');
  };

  const handleProjectSelect = (projectId: string) => {
    setAppState('dashboard');
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAppState('login');
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'daily-expenses':
        return <DailyExpenseEntry />;
      case 'expense-comparison':
        return <DailyExpenseComparison />;
      case 'artists':
      case 'technicians':
        return <ArtistsTechnicians />;
      case 'song-bgm':
        return <SongBGM />;
      case 'reports':
        return <Reports />;
      case 'documents':
        return <DocumentManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  if (appState === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (appState === 'project-selection') {
    return <ProjectSelection onSelectProject={handleProjectSelect} />;
  }

  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
}
