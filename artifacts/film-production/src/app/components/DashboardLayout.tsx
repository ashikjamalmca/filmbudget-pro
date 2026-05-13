import React, { useState } from 'react';
import {
  LayoutDashboard, Receipt, BarChart3, Users,
  FileText, FolderOpen, Settings, ChevronLeft, ChevronRight,
  LogOut, User, DollarSign, Menu, Film,
  AlertTriangle, Building2, Wallet, History, ChevronDown, ChevronUp,
  TrendingUp, Sliders,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  projectId: string | null;
}

export function DashboardLayout({ children, currentPage, onNavigate, onLogout, projectId }: DashboardLayoutProps) {
  const { profile, tenant, subscription, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(
    ['budget-tracker', 'budget-comparison', 'budget-setup'].includes(currentPage)
  );

  const isProducer = profile?.role === 'producer';

  const budgetPages = ['budget-tracker', 'budget-comparison', 'budget-setup'];
  const isBudgetActive = budgetPages.includes(currentPage);

  const topItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const budgetSubItems = [
    { id: 'budget-tracker', label: 'Budget Tracker', icon: TrendingUp },
    { id: 'budget-comparison', label: 'Budget Comparison', icon: BarChart3 },
    { id: 'budget-setup', label: 'Budget Setup', icon: Sliders },
  ];

  const bottomItems = [
    { id: 'daily-expenses', label: 'Daily Expense Entry', icon: Receipt },
    { id: 'expense-history', label: 'Expense History', icon: History },
    { id: 'remuneration', label: 'Remuneration', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    ...(isProducer ? [{ id: 'users', label: 'Team Management', icon: Users }] : []),
    ...(isProducer ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];

  const displayName = profile?.full_name ?? 'User';
  const roleLabel = profile?.role
    ? { producer: 'Producer', accounts: 'Accounts', 'production-manager': 'Production Manager', viewer: 'Viewer' }[profile.role] ?? profile.role
    : 'Team Member';

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  // Subscription expiry warning
  const subExpired = subscription?.valid_until ? new Date(subscription.valid_until) < new Date() : false;
  const subExpiringSoon = subscription?.valid_until && !subExpired
    ? new Date(subscription.valid_until).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false;

  const NavigationContent = () => (
    <>
      {/* Tenant info */}
      {!collapsed && tenant && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-white/50" />
            <span className="text-xs text-white/60 truncate">{tenant.name}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Top items */}
        {topItems.map((item) => {
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

        {/* Budget group */}
        <button
          onClick={() => {
            if (collapsed) { onNavigate('budget-tracker'); setMobileMenuOpen(false); }
            else setBudgetOpen(o => !o);
          }}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
            isBudgetActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
          title={collapsed ? 'Budget' : undefined}
        >
          <Wallet className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Budget</span>
              {budgetOpen ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
            </>
          )}
        </button>

        {/* Budget sub-items */}
        {!collapsed && budgetOpen && (
          <div className="ml-3 pl-3 border-l border-white/20 space-y-0.5">
            {budgetSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom items */}
        {bottomItems.map((item) => {
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
              <span className="text-base font-semibold">FilmBudget Pro</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="text-white hover:bg-white/10">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>
        <NavigationContent />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Subscription warnings */}
        {subExpired && (
          <div className="bg-red-600 text-white px-4 py-2 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Your subscription has expired. Contact your administrator to renew.
          </div>
        )}
        {subExpiringSoon && !subExpired && (
          <div className="bg-amber-500 text-white px-4 py-2 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Your subscription expires on {new Date(subscription!.valid_until!).toLocaleDateString('en-IN')}. Please renew soon.
          </div>
        )}

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
            <h1 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
              {tenant?.name ?? 'FilmBudget Pro'}
            </h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden md:inline text-sm">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="font-medium">{displayName}</div>
                <div className="text-xs text-gray-500 font-normal">{roleLabel}</div>
                {tenant && <div className="text-xs text-gray-400 font-normal">{tenant.name}</div>}
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
