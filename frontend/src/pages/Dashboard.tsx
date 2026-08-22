import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayAttendance, getMyAttendance, type AttendanceRecord } from '@/services/attendance';
import { getMyLeaveBalances, getMyLeaveRequests, type LeaveBalance, type LeaveRequest } from '@/services/leave';
import { getMySalary, type EmployeeSalary } from '@/services/payroll';
import { getEmployeeReport } from '@/services/reports';
import TodayAttendanceCard from '@/components/attendance/TodayAttendanceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  getAnnouncements,
  getHolidays,
  createAnnouncement,
  createHoliday,
  deleteAnnouncement,
  deleteHoliday,
  type Announcement,
  type Holiday
} from '@/services/company';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  Plus, 
  Building2,
  Sparkles,
  Zap,
  BarChart3,
  Megaphone,
  Gift,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);
  const [adminReport, setAdminReport] = useState<any>(null);

  // Dynamic Announcements & Holidays State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Admin Manager Modals State
  const [isAddAnnOpen, setIsAddAnnOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnSummary, setNewAnnSummary] = useState('');
  const [newAnnTag, setNewAnnTag] = useState('Notice');
  const [newAnnTagColor, setNewAnnTagColor] = useState('bg-blue-50 text-[#0052FF] border-blue-100');
  const [annError, setAnnError] = useState('');

  const [isAddHolOpen, setIsAddHolOpen] = useState(false);
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolType, setNewHolType] = useState('Gazetted');
  const [holError, setHolError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekStart = monday.toISOString().split('T')[0];
      const weekEnd = sunday.toISOString().split('T')[0];

      const promises: Promise<any>[] = [
        getTodayAttendance().catch(() => ({ data: null })),
        getMyLeaveBalances().catch(() => ({ data: [] })),
        getMyLeaveRequests().catch(() => ({ data: [] })),
        getMySalary().catch(() => ({ data: null })),
        getMyAttendance({ start_date: weekStart, end_date: weekEnd, limit: 7 }).catch(() => ({ data: [] })),
        getAnnouncements().catch(() => ({ data: [] })),
        getHolidays().catch(() => ({ data: [] }))
      ];

      if (isAdmin) {
        promises.push(getEmployeeReport().catch(() => ({ data: null })));
      }

      const results = await Promise.all(promises);
      setTodayAttendance(results[0]?.data || null);
      setLeaveBalances(results[1]?.data || []);
      setPendingLeaves((results[2]?.data || []).filter((r: LeaveRequest) => r.status === 'PENDING'));
      setMySalary(results[3]?.data || null);
      setWeeklyAttendance(results[4]?.data || []);
      setAnnouncements(results[5]?.data || []);
      setHolidays(results[6]?.data || []);
      if (isAdmin) {
        setAdminReport(results[7]?.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError('');
    if (!newAnnTitle.trim() || !newAnnSummary.trim()) {
      setAnnError('Title and Summary are required.');
      return;
    }
    try {
      const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await createAnnouncement({
        title: newAnnTitle,
        summary: newAnnSummary,
        date: nowStr,
        tag: newAnnTag,
        tag_color: newAnnTagColor
      });
      setNewAnnTitle('');
      setNewAnnSummary('');
      setIsAddAnnOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      setAnnError(err.response?.data?.detail || 'Failed to post announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolError('');
    if (!newHolName.trim() || !newHolDate) {
      setHolError('Holiday Name and Date are required.');
      return;
    }
    try {
      await createHoliday({
        name: newHolName,
        date: newHolDate,
        type: newHolType
      });
      setNewHolName('');
      setNewHolDate('');
      setIsAddHolOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      setHolError(err.response?.data?.detail || 'Failed to add holiday.');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return;
    try {
      await deleteHoliday(id);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete holiday', err);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const [weeklyAttendance, setWeeklyAttendance] = useState<AttendanceRecord[]>([]);

  // Compute weekly bars from real attendance data
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MAX_HOURS = 10;

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const weeklyBars = DAY_LABELS.map((label, i) => {
    const { start } = getWeekRange();
    const targetDate = new Date(start);
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const record = weeklyAttendance.find(r => r.date === dateStr);
    const hours = record?.worked_hours || 0;
    const pct = Math.min(100, Math.round((hours / MAX_HOURS) * 100));
    return { day: label, hours: Number(hours).toFixed(1), height: `${Math.max(pct, record ? 5 : 0)}%`, hasData: !!record };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Animated Hero Banner with Light Blue Mesh Glow */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-sky-600/15 border border-sky-400/30 relative overflow-hidden group">
        {/* Ambient Glow background */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 text-sky-100 border border-white/20 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-sky-200 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Enterprise HR Portal</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-snug">
              {getGreeting()}, <span className="text-sky-200">{user?.email?.split('@')[0]}</span> 👋
            </h1>

            <p className="text-sky-100/90 text-xs sm:text-sm max-w-xl leading-relaxed font-medium">
              {isAdmin 
                ? "Here is your executive HR overview across workforce headcount, leave approvals, and payroll expenditure." 
                : "Manage your daily shift attendance, time-off entitlement balances, and official salary payslips."}
            </p>
          </div>

          {/* Quick Hub Actions */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <Link 
              to="/time-off"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md backdrop-blur-md hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-sky-200" />
              <span>Request Leave</span>
            </Link>
            <Link 
              to="/payroll"
              className="bg-white text-slate-900 hover:bg-sky-50 font-black text-xs px-4 py-3 rounded-xl transition-all shadow-lg shadow-black/10 hover:scale-105 flex items-center space-x-2"
            >
              <DollarSign className="w-4 h-4 text-sky-600" />
              <span>View Payslip</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Light Blue Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isAdmin && adminReport && (
          <>
            <Link to="/employees" className="block transform hover:scale-[1.02] transition-transform duration-200">
              <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group h-full cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Headcount</span>
                    <span className="text-3xl font-black font-mono text-slate-900 mt-1 block group-hover:text-[#0052FF] transition-colors">
                      {adminReport.total_employees}
                    </span>
                  </div>
                  <div className="p-3 bg-sky-50 rounded-2xl text-[#0052FF] group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[11px] text-slate-500 font-semibold space-x-1">
                  <span className="text-[#0052FF] font-bold">{adminReport.active_employees} Active</span>
                  <span>• {adminReport.inactive_employees} Inactive</span>
                </div>
              </Card>
            </Link>

            <Link to="/employees" className="block transform hover:scale-[1.02] transition-transform duration-200">
              <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group h-full cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Departments</span>
                    <span className="text-3xl font-black font-mono text-slate-900 mt-1 block group-hover:text-indigo-600 transition-colors">
                      {adminReport.department_breakdown?.length || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 font-semibold">
                  <span>Active Organizational Units</span>
                </div>
              </Card>
            </Link>
          </>
        )}

        {!isAdmin && (
          <Link to="/payroll" className="block transform hover:scale-[1.02] transition-transform duration-200">
            <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Net Take-Home Pay</span>
                  <span className="text-3xl font-black font-mono text-[#0052FF] mt-1 block group-hover:scale-105 transition-transform origin-left">
                    {formatCurrency(mySalary?.net_salary)}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-[#0052FF] group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-500 font-semibold">
                <span>Gross: {formatCurrency(mySalary?.gross_salary)}</span>
              </div>
            </Card>
          </Link>
        )}

        <Link to="/time-off" className="block transform hover:scale-[1.02] transition-transform duration-200">
          <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group h-full cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending Leave Requests</span>
                <span className="text-3xl font-black font-mono text-amber-600 mt-1 block">
                  {pendingLeaves.length}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-semibold">
              <span>Awaiting approval action</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Content Viewport */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column: Attendance Card & Trend Chart */}
        <div className="lg:col-span-2 space-y-6">
          {!isAdmin && (
            <TodayAttendanceCard 
              attendance={todayAttendance} 
              onUpdate={fetchDashboardData} 
            />
          )}

          {!isAdmin && (
            <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                    <span>Shift Attendance Activity</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Weekly logged hours overview</p>
                </div>
                <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full uppercase">
                  Current Week
                </span>
              </div>

              {/* Visual Bar Chart */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-4 bg-sky-50/40 rounded-2xl border border-sky-100">
                {weeklyBars.map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full max-w-[36px] bg-slate-200/80 rounded-t-xl overflow-hidden h-full flex items-end" title={bar.hasData ? `${bar.hours}h` : 'No data'}>
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-500 ${bar.hasData ? 'bg-gradient-to-t from-sky-500 to-blue-600 group-hover:from-sky-400 group-hover:to-blue-500' : 'bg-slate-300/50'}`}
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{bar.day}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Latest Announcements notice board */}
          <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                  <Megaphone className="w-4 h-4 text-[#0052FF]" />
                  <span>Company Announcements</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Stay updated with latest corporate news & policy changes</p>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => {
                    setAnnError('');
                    setIsAddAnnOpen(true);
                  }}
                  className="bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-black px-3.5 h-8 rounded-xl shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Post Notice
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No announcements published yet.</p>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/60 transition-colors border border-slate-100 flex items-start justify-between gap-3 group/ann">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${ann.tag_color}`}>{ann.tag}</span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{ann.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">{ann.summary}</p>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md border border-slate-200 bg-white shadow-xs opacity-0 group-hover/ann:opacity-100 shrink-0"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Time Off & Portal Navigation */}
        <div className="space-y-6">
          {/* Leave Entitlement Progress Meters */}
          {!isAdmin && (
            <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>Leave Balances</span>
                  </CardTitle>
                  <Link to="/time-off" className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors">
                    Manage →
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {leaveBalances.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No leave balances allocated yet.</p>
                ) : (
                  leaveBalances.slice(0, 3).map(b => {
                    const pct = Math.min(100, Math.round((b.remaining_days / (b.max_days || 1)) * 100));
                    return (
                      <div key={b.leave_type_id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800">{b.leave_type_name}</span>
                          <span className="font-mono text-slate-900">{b.remaining_days} / {b.max_days} days</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                          <div 
                            className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Hub Navigation Cards */}
          <Card className="bg-slate-950 text-white rounded-2xl p-5 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
            
            <h4 className="font-black text-xs text-sky-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Direct Modules</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
              {!isAdmin ? (
                <>
                  <Link 
                    to="/payroll"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Payslips</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>

                  <Link 
                    to="/documents"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Documents</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>

                  <Link 
                    to="/time-off"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Apply Leave</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>

                  <Link 
                    to="/attendance"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/employees"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Employees</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>

                  <Link 
                    to="/reports"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>HR Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>

                  <Link 
                    to="/time-off"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Leave Approvals</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>

                  <Link 
                    to="/payroll"
                    className="bg-slate-900 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-200 hover:text-white transition-all hover:scale-105 border border-slate-800"
                  >
                    <span>Run Payroll</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </Link>
                </>
              )}
            </div>
          </Card>

          {/* Upcoming Holidays list */}
          <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Gift className="w-4 h-4 text-[#0052FF]" />
                <span>Upcoming Holidays</span>
              </CardTitle>
              {isAdmin && (
                <button
                  onClick={() => {
                    setHolError('');
                    setIsAddHolOpen(true);
                  }}
                  className="p-1 text-slate-500 hover:text-[#0052FF] transition-colors hover:bg-slate-50 rounded-lg border border-slate-150"
                  title="Add Holiday"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              {holidays.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No holidays listed.</p>
              ) : (
                holidays.map(h => (
                  <div key={h.id} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0 group/hol">
                    <div>
                      <h5 className="font-bold text-slate-800">{h.name}</h5>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-black uppercase bg-blue-50 text-[#0052FF] px-2 py-0.5 rounded border border-blue-100">{h.type}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-0.5 rounded border border-slate-200 bg-white opacity-0 group-hover/hol:opacity-100"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post Announcement Modal */}
      {isAdmin && isAddAnnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
              <div className="text-lg font-bold text-white flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-[#0052FF]" />
                <span>Post Announcement</span>
              </div>
              <button 
                onClick={() => setIsAddAnnOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4">
              {annError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center text-xs font-semibold border border-red-200">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {annError}
                </div>
              )}

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title *</label>
                  <Input 
                    className="h-10 text-xs rounded-xl"
                    placeholder="Enter short, descriptive title"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Summary *</label>
                  <textarea 
                    className="w-full min-h-[80px] p-3 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/35 font-medium text-slate-700"
                    placeholder="Enter summary details of the announcement"
                    value={newAnnSummary}
                    onChange={(e) => setNewAnnSummary(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tag Name</label>
                    <Input 
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Facility, Notice, Event"
                      value={newAnnTag}
                      onChange={(e) => setNewAnnTag(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tag Styling</label>
                    <select
                      className="w-full h-10 px-3 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/35 font-semibold text-slate-700"
                      value={newAnnTagColor}
                      onChange={(e) => setNewAnnTagColor(e.target.value)}
                    >
                      <option value="bg-blue-50 text-[#0052FF] border-blue-100">Blue (Notice)</option>
                      <option value="bg-emerald-50 text-emerald-700 border-emerald-100">Green (Event)</option>
                      <option value="bg-purple-50 text-purple-700 border-purple-100">Purple (Facility)</option>
                      <option value="bg-amber-50 text-amber-700 border-amber-100">Amber (Warning)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddAnnOpen(false)} 
                    className="text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-xl shadow-md"
                  >
                    Post Notice
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAdmin && isAddHolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
              <div className="text-lg font-bold text-white flex items-center space-x-2">
                <Gift className="w-5 h-5 text-[#0052FF]" />
                <span>Add Company Holiday</span>
              </div>
              <button 
                onClick={() => setIsAddHolOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4">
              {holError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center text-xs font-semibold border border-red-200">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {holError}
                </div>
              )}

              <form onSubmit={handleCreateHoliday} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Name *</label>
                  <Input 
                    className="h-10 text-xs rounded-xl"
                    placeholder="e.g. Independence Day"
                    value={newHolName}
                    onChange={(e) => setNewHolName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <Input 
                    type="date"
                    className="h-10 text-xs rounded-xl"
                    value={newHolDate}
                    onChange={(e) => setNewHolDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Type</label>
                  <select
                    className="w-full h-10 px-3 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/35 font-semibold text-slate-700"
                    value={newHolType}
                    onChange={(e) => setNewHolType(e.target.value)}
                  >
                    <option value="Gazetted">Gazetted</option>
                    <option value="National">National</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddHolOpen(false)} 
                    className="text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-xl shadow-md"
                  >
                    Add Holiday
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
