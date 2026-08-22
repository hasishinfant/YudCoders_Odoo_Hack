import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Clock, 
  Calendar, 
  DollarSign, 
  Folder, 
  Award,
  BarChart3, 
  Megaphone,
  HelpCircle,
  Settings,
  LogOut, 
  Menu, 
  X,
  Search,
  Mail,
  Sun,
  ChevronRight,
  ChevronDown,
  Headphones
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  interface NavItem {
    path: string;
    label: string;
    icon: any;
    employeeOnly?: boolean;
    adminOnly?: boolean;
    badge?: string;
    badgeColor?: string;
    dotBadge?: boolean;
  }

  const allNavItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'My Profile', icon: User, employeeOnly: true },
    { path: '/attendance', label: 'Attendance', icon: Clock, employeeOnly: true },
    { path: '/time-off', label: 'Leave Requests', icon: Calendar },
    { path: '/payroll', label: 'Payroll', icon: DollarSign },
    { path: '/documents', label: 'Documents', icon: Folder },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/performance', label: 'Performance', icon: Award, employeeOnly: true },
    { path: '/announcements', label: 'Announcements', icon: Megaphone, dotBadge: true },
    { path: '/help', label: 'Help & Support', icon: HelpCircle },
    { path: '/settings', label: 'Settings', icon: Settings },
    // Admin-only items
    { path: '/employees', label: 'Employees', icon: User, adminOnly: true },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    if (item.employeeOnly && user?.role === 'ADMIN') return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#F4F7FC] font-sans antialiased text-slate-900">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-700 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-200/80 shadow-xs
        md:translate-x-0 md:static md:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Sidebar Header Brand */}
          <div className="h-20 flex items-center justify-between px-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0052FF] to-blue-500 flex items-center justify-center font-black text-white text-xl shadow-md shadow-blue-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight block leading-tight">{(user as any)?.company_name || (user?.role === 'ADMIN' ? 'HR Portal' : 'Employee Portal')}</span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider block">HR Management System</span>
                <span className={`inline-block text-[8px] font-black tracking-wider uppercase px-2 py-0.5 mt-1 rounded-full ${
                  user?.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-[#0052FF]'
                }`}>
                  {user?.role === 'ADMIN' ? 'HR / Admin Portal' : 'Employee Portal'}
                </span>
              </div>
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-4 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-260px)]">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive 
                      ? 'bg-[#0052FF] text-white font-bold shadow-md shadow-blue-500/25' 
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.dotBadge && (
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                  )}
                  {isActive && !item.badge && !item.dotBadge && (
                    <ChevronRight className="w-4 h-4 text-white" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Callout & Logout Footer */}
        <div className="p-4 space-y-3 border-t border-slate-100">
          {/* Help Hub CTA Card */}
          <div className="bg-[#0052FF] text-white p-4 rounded-2xl space-y-3 shadow-lg shadow-blue-500/20">
            <div className="flex items-center space-x-2">
              <Headphones className="w-5 h-5 text-white" />
              <div>
                <h4 className="font-extrabold text-xs">Need Help?</h4>
                <p className="text-[10px] text-blue-100">We're here to assist you!</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/help')}
              className="w-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-between"
            >
              <span>Contact HR Support</span>
              <span className="text-sm">→</span>
            </button>
          </div>

          {/* Logout Action */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees, documents, leave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
              />
              <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs font-mono">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-5">
            {/* Theme Toggle */}
            <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="Toggle Theme">
              <Sun className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Messages Icon */}
            <div className="relative">
              <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="Messages">
                <Mail className="w-5 h-5" />
                <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  3
                </span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-3 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-[#0052FF] text-white font-bold flex items-center justify-center text-sm shrink-0 border border-blue-400 shadow-inner">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>

                 <div className="hidden md:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight font-black">{user?.email?.split('@')[0].toUpperCase() || 'USER'}</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[9px] text-slate-500 font-mono font-bold">EMP00123</span>
                    <span className="text-[9px] text-slate-300">•</span>
                    <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded-md ${
                      user?.role === 'ADMIN' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-[#0052FF] border border-blue-200'
                    }`}>
                      {user?.role === 'ADMIN' ? 'HR Admin' : 'Employee'}
                    </span>
                  </div>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs font-semibold">
                  {user?.role === 'ADMIN' ? (
                    <Link 
                      to="/employees" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                    >
                      Employees Directory
                    </Link>
                  ) : (
                    <Link 
                      to="/profile" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                    >
                      My Profile
                    </Link>
                  )}
                  <Link 
                    to="/settings" 
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                  >
                    Account Settings
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-bold"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
