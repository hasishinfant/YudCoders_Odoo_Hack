import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">Dayflow</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/" className="flex items-center space-x-3 px-3 py-2 bg-slate-100 text-slate-900 rounded-md">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shrink-0">
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600">
              {user?.email} ({user?.role})
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
