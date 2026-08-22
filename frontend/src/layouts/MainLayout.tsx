import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, Clock, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/attendance', label: 'Attendance', icon: Clock, show: true },
    { path: '/time-off', label: 'Time Off', icon: Calendar, show: true },
    { path: '/employees', label: 'Employees', icon: Users, show: isAdmin },
    { path: '/profile', label: 'My Profile', icon: User, show: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span className="bg-slate-900 text-white w-8 h-8 rounded flex items-center justify-center font-black text-sm">D</span>
              <span>Dayflow</span>
            </h1>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.filter(item => item.show).map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center md:hidden space-x-2">
            <span className="font-bold text-slate-900">Dayflow</span>
          </div>

          <div className="flex-1 hidden md:block" />

          <div className="flex items-center space-x-3">
            <Link 
              to="/profile"
              className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <span className="text-sm font-bold text-slate-900 block leading-tight">{user?.email}</span>
                <span className="text-xs text-slate-500 font-semibold uppercase">{user?.role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
