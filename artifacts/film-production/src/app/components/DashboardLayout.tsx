import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Users,
  Wrench,
  Music,
  FileText,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  User,
  DollarSign,
  Menu,
  Film,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  projectId: string | null;
}

export function DashboardLayout({ children, currentPage, onNavigate, onLogout, projectId }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [remunerationExpanded, setRemunerationExpanded] = useState(
    ['artists', 'technicians', 'song-bgm'].includes(currentPage)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-expenses', label: 'Daily Expenses', icon: Receipt },
    { id: 'expense-comparison', label: 'Budget Comparison', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'users', label: 'User Management', icon: Settings },
  ];

  const remunerationItems = [
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'technicians', label: 'Technicians', icon: Wrench },
    { id: 'song-bgm', label: 'Song & BGM', icon: Music },
  ];

  const displayName = profile?.full_name ?? 'User';
  const roleLabel = profile?.role
    ? { producer: 'Producer', accounts: 'Accounts', 'production-manager': 'Production Manager', viewer: 'Viewer' }[profile.role] ?? profile.role
    : 'Team Member';

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const NavigationContent = () => (
    <>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        <div>
          <button
            onClick={() => setRemunerationExpanded(!remunerationExpanded)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              ['artists', 'technicians', 'song-bgm'].includes(currentPage)
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title={collapsed ? 'Remuneration' : undefined}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Remuneration</span>
                {remunerationExpanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
              </>
            )}
          </button>

          {!collapsed && remunerationExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {remunerationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`hidden lg:flex bg-[#1E3A8A] text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Film className="w-6 h-6" />
              <span className="text-lg">FilmBudget Pro</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="text-white hover:bg-white/10">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>
        <NavigationContent />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-[#1E3A8A] text-white">
              <SheetHeader className="p-4 border-b border-white/10">
                <SheetTitle className="text-white text-left flex items-center gap-2">
                  <Film className="w-5 h-5" /> FilmBudget Pro
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100%-73px)]">
                <NavigationContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg lg:text-xl text-gray-900 truncate">FilmBudget Pro</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>{displayName}</div>
                <div className="text-xs text-gray-500 font-normal">{roleLabel}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
