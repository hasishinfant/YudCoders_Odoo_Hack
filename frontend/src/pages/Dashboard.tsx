import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayAttendance, getMyAttendance, type AttendanceRecord } from '@/services/attendance';
import { getMyLeaveBalances, getMyLeaveRequests, type LeaveBalance, type LeaveRequest } from '@/services/leave';
import { getMySalary, type EmployeeSalary } from '@/services/payroll';
import { getEmployeeReport } from '@/services/reports';
import TodayAttendanceCard from '@/components/attendance/TodayAttendanceCard';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  Plus, 
  Building2,
  Sparkles,
  Zap,
  BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);
  const [adminReport, setAdminReport] = useState<any>(null);

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
        getMyAttendance({ start_date: weekStart, end_date: weekEnd, limit: 7 }).catch(() => ({ data: [] }))
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
      if (isAdmin) {
        setAdminReport(results[5]?.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
            <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Headcount</span>
                  <span className="text-3xl font-black font-mono text-slate-900 mt-1 block group-hover:text-sky-600 transition-colors">
                    {adminReport.total_employees}
                  </span>
                </div>
                <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-[11px] text-slate-500 font-semibold space-x-1">
                <span className="text-sky-600 font-bold">{adminReport.active_employees} Active</span>
                <span>• {adminReport.inactive_employees} Inactive</span>
              </div>
            </Card>

            <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group">
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
          </>
        )}

        {!isAdmin && (
          <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Net Take-Home Pay</span>
                <span className="text-3xl font-black font-mono text-sky-600 mt-1 block group-hover:scale-105 transition-transform origin-left">
                  {formatCurrency(mySalary?.net_salary)}
                </span>
              </div>
              <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-semibold">
              <span>Gross: {formatCurrency(mySalary?.gross_salary)}</span>
            </div>
          </Card>
        )}

        <Card className="bg-white border-sky-100/80 shadow-sm rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200 transition-all duration-300 group">
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
        </div>
      </div>
    </div>
  );
}
