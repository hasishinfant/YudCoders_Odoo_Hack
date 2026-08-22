import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayAttendance, getMyAttendance, getAdminAttendance, type AttendanceRecord } from '@/services/attendance';
import { getMyLeaveBalances, getMyLeaveRequests, getAdminLeaveRequests, type LeaveBalance, type LeaveRequest } from '@/services/leave';
import { getMySalary, type EmployeeSalary } from '@/services/payroll';
import { getEmployeeReport, getPayrollReport } from '@/services/reports';
import { getEmployees } from '@/services/employees';
import { getDepartments } from '@/services/departments';
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
  AlertCircle,
  Clock,
  FileText,
  Search
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

  // Workforce Status Directory table states
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [searchQueryTable, setSearchQueryTable] = useState('');
  const [deptFilterTable, setDeptFilterTable] = useState('');
  const [statusFilterTable, setStatusFilterTable] = useState('');
  const [designationFilterTable, setDesignationFilterTable] = useState('');
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  const [isAddHolOpen, setIsAddHolOpen] = useState(false);
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolType, setNewHolType] = useState('Gazetted');
  const [holError, setHolError] = useState('');

  // Admin enriched data states
  const [todayAttendanceRecords, setTodayAttendanceRecords] = useState<any[]>([]);
  const [payrollReport, setPayrollReport] = useState<any>(null);
  const [adminAllLeaves, setAdminAllLeaves] = useState<any[]>([]);

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
        const today = new Date().toISOString().split('T')[0];
        promises.push(getEmployeeReport().catch(() => ({ data: null })));                       // [7]
        promises.push(getEmployees({ limit: 100 }).catch(() => ({ data: [] })));               // [8]
        promises.push(getDepartments().catch(() => ({ data: [] })));                           // [9]
        promises.push(getAdminAttendance({ date: today, limit: 100 }).catch(() => ({ data: [] }))); // [10]
        promises.push(getAdminLeaveRequests({ limit: 50 }).catch(() => ({ data: [] })));       // [11]
        promises.push(getPayrollReport().catch(() => ({ data: null })));                       // [12]
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
        setEmployeeList(results[8]?.data?.data || results[8]?.data || []);
        setDepartmentsList(results[9]?.data?.data || results[9]?.data || []);
        setTodayAttendanceRecords(results[10]?.data?.data || results[10]?.data || []);
        setAdminAllLeaves(results[11]?.data?.data || results[11]?.data || []);
        setPayrollReport(results[12]?.data || null);
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

  if (isAdmin) {
    const uniqueDesignations = Array.from(new Set(employeeList.map(e => e.job_title).filter(Boolean)));
    const today = new Date().toISOString().split('T')[0];

    // Build today's attendance map: employee_id -> attendance record
    const todayAttMap: Record<number, any> = {};
    todayAttendanceRecords.forEach(r => { todayAttMap[r.employee_id] = r; });

    // Compute live metrics from real data
    const totalEmployees = adminReport?.total_employees ?? employeeList.length;
    const activeEmployees = adminReport?.active_employees ?? employeeList.filter(e => e.employment_status === 'ACTIVE').length;
    const onLeaveCount = adminAllLeaves.filter(r => r.status === 'APPROVED' && new Date(r.start_date) <= new Date(today) && new Date(r.end_date) >= new Date(today)).length;
    const pendingApprovalsCount = adminAllLeaves.filter(r => r.status === 'PENDING').length;
    const presentTodayCount = todayAttendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentTodayCount = totalEmployees - presentTodayCount - onLeaveCount;
    const avgAttPct = totalEmployees > 0 ? Math.round((presentTodayCount / totalEmployees) * 100) : 0;
    const totalNetPayroll = payrollReport?.total_net_salary ?? 0;
    const recentHires = adminReport?.recent_hires ?? [];

    // Filter table
    const tableFiltered = employeeList.filter(emp => {
      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      const code = (emp.employee_code || '').toLowerCase();
      const dept = (emp.department_name || '').toLowerCase();
      const search = searchQueryTable.toLowerCase();
      const matchesSearch = !search || name.includes(search) || code.includes(search) || dept.includes(search);
      const matchesDept = !deptFilterTable || emp.department_name === deptFilterTable;
      const attRecord = todayAttMap[emp.id];
      const empStatus = attRecord?.status || (onLeaveCount > 0 ? 'ABSENT' : 'ABSENT');
      const matchesStatus = !statusFilterTable || empStatus === statusFilterTable;
      const matchesDesignation = !designationFilterTable || emp.job_title === designationFilterTable;
      return matchesSearch && matchesDept && matchesStatus && matchesDesignation;
    });

    // Recent activity feed: combine recent hires + recent leave requests
    const recentActivity = [
      ...recentHires.slice(0, 3).map((h: any) => ({
        type: 'hire',
        text: `${h.name} joined as ${h.job_title || 'Employee'}`,
        dept: h.department,
        time: h.joining_date,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
      })),
      ...adminAllLeaves.slice(0, 4).map((r: any) => ({
        type: 'leave',
        text: `${r.employee_name || 'Employee'} requested ${r.leave_type_name || 'leave'}`,
        dept: r.department_name,
        time: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
        color: r.status === 'PENDING' ? 'text-orange-600' : r.status === 'APPROVED' ? 'text-emerald-600' : 'text-red-600',
        bg: r.status === 'PENDING' ? 'bg-orange-50' : r.status === 'APPROVED' ? 'bg-emerald-50' : 'bg-red-50',
        border: r.status === 'PENDING' ? 'border-orange-100' : r.status === 'APPROVED' ? 'border-emerald-100' : 'border-red-100',
        status: r.status
      }))
    ].slice(0, 6);

    return (
      <div className="space-y-5 max-w-7xl mx-auto pb-8">
        {/* Welcome back Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex justify-between items-center">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Welcome back, <span className="text-[#0052FF]">{user?.email?.split('@')[0]}</span> 👋
            </h1>
            <p className="text-xs text-slate-500">Here's what's happening in your organisation today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddAnnOpen(true)} className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /><span>Post Announcement</span>
            </Button>
            <Link to="/employees" className="bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 transition-colors">
              <Users className="w-3.5 h-3.5" /><span>Add Employee</span>
            </Link>
          </div>
        </div>

        {/* 6-Widget Metric Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Total Employees */}
          <Link to="/employees" className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:border-[#0052FF]/40 transition-all block group">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Employees</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{totalEmployees}</span>
              </div>
              <div className="p-2 bg-blue-50 text-[#0052FF] rounded-xl border border-blue-100 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[9px] font-bold text-emerald-600">{activeEmployees} active</div>
            <svg className="w-full h-7" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M 0 25 Q 15 10, 30 20 T 60 5 T 100 12" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>

          {/* 2. Present Today */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Present Today</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{presentTodayCount}</span>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[9px] font-bold text-emerald-600">{avgAttPct}% attendance rate</div>
            <svg className="w-full h-7" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M 0 22 Q 20 8, 40 18 T 80 5 T 100 15" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 3. On Leave */}
          <Link to="/time-off" className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 block hover:border-amber-300 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">On Leave</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{onLeaveCount}</span>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[9px] font-bold text-slate-500">{totalEmployees > 0 ? ((onLeaveCount / totalEmployees) * 100).toFixed(1) : 0}% of total</div>
            <svg className="w-full h-7" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M 0 15 Q 30 25, 60 10 T 100 18" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>

          {/* 4. Pending Approvals */}
          <Link to="/time-off" className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:border-orange-300 transition-all block">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                <span className="text-2xl font-black font-mono text-orange-600 mt-1 block">{String(pendingApprovalsCount).padStart(2, '0')}</span>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[9px] font-black text-[#0052FF]">View all →</div>
            <svg className="w-full h-7" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M 0 12 Q 25 22, 50 12 T 100 18" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>

          {/* 5. Absent Today */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Absent Today</span>
                <span className="text-2xl font-black font-mono text-red-600 mt-1 block">{absentTodayCount > 0 ? absentTodayCount : '00'}</span>
              </div>
              <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[9px] font-bold text-slate-500">No check-in recorded</div>
            <svg className="w-full h-7" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M 0 20 Q 30 5, 60 15 T 100 10" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 6. Net Payroll */}
          <Link to="/payroll" className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:border-purple-300 transition-all block">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Net Payroll</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  {totalNetPayroll > 0 ? `₹${(totalNetPayroll / 1000).toFixed(0)}K` : '—'}
                </span>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[9px] font-bold text-purple-600">This month's payroll</div>
            <svg className="w-full h-7" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M 0 12 Q 25 5, 50 15 T 100 8" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Middle Row: Activity Feed + Attendance Summary + Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity Feed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Recent Activity</h3>
              <span className="text-[10px] text-slate-400 font-bold">Live Feed</span>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No recent activity.</p>
              ) : recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full ${item.bg} ${item.border} border flex items-center justify-center shrink-0`}>
                    {item.type === 'hire' ? <Users className={`w-3.5 h-3.5 ${item.color}`} /> : <FileText className={`w-3.5 h-3.5 ${item.color}`} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">{item.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.dept && <span className="text-[10px] text-slate-400 truncate">{item.dept}</span>}
                      {'status' in item && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.bg} ${item.color} border ${item.border}`}>{item.status}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Attendance Summary */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Attendance Summary</h3>
              <Link to="/attendance" className="text-[10px] text-[#0052FF] font-black hover:underline">View All →</Link>
            </div>
            <div className="space-y-3">
              {/* Attendance Progress Bars */}
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-emerald-700">Present</span>
                  <span className="text-emerald-700">{presentTodayCount} / {totalEmployees}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${totalEmployees > 0 ? (presentTodayCount / totalEmployees) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-amber-600">On Leave</span>
                  <span className="text-amber-600">{onLeaveCount} / {totalEmployees}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${totalEmployees > 0 ? (onLeaveCount / totalEmployees) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-red-600">Absent</span>
                  <span className="text-red-600">{Math.max(0, absentTodayCount)} / {totalEmployees}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${totalEmployees > 0 ? (Math.max(0, absentTodayCount) / totalEmployees) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-3">
                <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Dept Breakdown</p>
                <div className="space-y-1.5">
                  {(adminReport?.department_breakdown || []).slice(0, 4).map((d: any, i: number) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span className="text-slate-600 font-bold truncate max-w-[120px]">{d.department}</span>
                      <span className="font-black text-slate-900 font-mono">{d.count}</span>
                    </div>
                  ))}
                  {(adminReport?.department_breakdown || []).length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No department data yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Announcements Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Announcements</h3>
              <button onClick={() => setIsAddAnnOpen(true)} className="text-[10px] text-[#0052FF] font-black hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Post
              </button>
            </div>
            <div className="space-y-2.5 flex-1">
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Megaphone className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 italic">No announcements yet.</p>
                  <button onClick={() => setIsAddAnnOpen(true)} className="mt-2 text-[10px] font-black text-[#0052FF] hover:underline">Post first announcement →</button>
                </div>
              ) : announcements.slice(0, 4).map(ann => (
                <div key={ann.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full border mb-1 ${ann.tag_color || 'bg-blue-50 text-[#0052FF] border-blue-100'}`}>{ann.tag || 'Notice'}</span>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{ann.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{ann.summary}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {announcements.length > 4 && (
              <Link to="/announcements" className="text-center text-[10px] font-black text-[#0052FF] hover:underline mt-3 block pt-3 border-t border-slate-100">
                View all {announcements.length} announcements →
              </Link>
            )}
          </div>
        </div>

        {/* Leave Requests Quick Panel + Payroll Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Leave Requests */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Leave Requests
                {pendingApprovalsCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[9px]">{pendingApprovalsCount} pending</span>
                )}
              </h3>
              <Link to="/time-off" className="text-[10px] text-[#0052FF] font-black hover:underline">Manage All →</Link>
            </div>
            <div className="space-y-2">
              {adminAllLeaves.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No leave requests found.</p>
              ) : adminAllLeaves.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0052FF] border border-blue-100 flex items-center justify-center text-xs font-black shrink-0">
                      {(r.employee_name || 'E')[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.employee_name || 'Employee'}</p>
                      <p className="text-[10px] text-slate-400">{r.leave_type_name} · {r.start_date} – {r.end_date}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                    r.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-red-50 text-red-700 border-red-100'
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payroll + Dept Summary */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Payroll Overview</h3>
              <Link to="/payroll" className="text-[10px] text-[#0052FF] font-black hover:underline">View Payroll →</Link>
            </div>
            {payrollReport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Records', value: payrollReport.total_payrolls, color: 'text-slate-900' },
                    { label: 'Gross Salary', value: `₹${(payrollReport.total_gross_salary / 1000).toFixed(1)}K`, color: 'text-[#0052FF]' },
                    { label: 'Deductions', value: `₹${(payrollReport.total_deductions / 1000).toFixed(1)}K`, color: 'text-red-600' },
                    { label: 'Net Salary', value: `₹${(payrollReport.total_net_salary / 1000).toFixed(1)}K`, color: 'text-emerald-700' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className={`text-lg font-black font-mono mt-0.5 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  {[
                    { label: 'Paid', count: payrollReport.paid_count, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { label: 'Processed', count: payrollReport.processed_count, color: 'bg-blue-50 text-[#0052FF] border-blue-100' },
                    { label: 'Draft', count: payrollReport.draft_count, color: 'bg-slate-100 text-slate-500 border-slate-200' },
                  ].map((s, i) => (
                    <div key={i} className={`flex-1 text-center py-2 rounded-xl border text-[10px] font-black ${s.color}`}>
                      <div className="text-sm font-black font-mono">{s.count}</div>
                      <div>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 italic">No payroll data found.</p>
                <Link to="/payroll" className="mt-2 text-[10px] font-black text-[#0052FF] hover:underline">Set up payroll →</Link>
              </div>
            )}
          </div>
        </div>

        {/* WORKFORCE STATUS DIRECTORY */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Workforce Status Directory</h2>
              <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[10px] font-black font-mono">
                {tableFiltered.length} results
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-Time Workforce Command Center</span>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search ID, name, dept..."
                className="h-10 pl-9 text-xs rounded-xl border-slate-200"
                value={searchQueryTable}
                onChange={(e) => setSearchQueryTable(e.target.value)}
              />
            </div>
            <select className="h-10 px-3 text-xs font-bold border rounded-xl bg-slate-50 border-slate-200 text-slate-700 focus:outline-none" value={deptFilterTable} onChange={(e) => setDeptFilterTable(e.target.value)}>
              <option value="">All Departments</option>
              {departmentsList.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <select className="h-10 px-3 text-xs font-bold border rounded-xl bg-slate-50 border-slate-200 text-slate-700 focus:outline-none" value={statusFilterTable} onChange={(e) => setStatusFilterTable(e.target.value)}>
              <option value="">All Attendance Status</option>
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="LEAVE">ON LEAVE</option>
            </select>
            <select className="h-10 px-3 text-xs font-bold border rounded-xl bg-slate-50 border-slate-200 text-slate-700 focus:outline-none" value={designationFilterTable} onChange={(e) => setDesignationFilterTable(e.target.value)}>
              <option value="">All Designations</option>
              {uniqueDesignations.map((title: any, idx: number) => <option key={idx} value={title}>{title}</option>)}
            </select>
          </div>

          {/* Workforce Table */}
          <div className="border border-slate-100 rounded-xl overflow-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                  <th className="p-3 pl-4">Employee ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Today's Attendance</th>
                  <th className="p-3">Designation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 italic text-xs">
                      {employeeList.length === 0 ? 'Loading employee records...' : 'No records match the current filters.'}
                    </td>
                  </tr>
                ) : tableFiltered.map(emp => {
                  const attRecord = todayAttMap[emp.id];
                  const attStatus = attRecord?.status || 'ABSENT';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 pl-4 font-mono font-black text-slate-500 text-[11px]">{emp.employee_code}</td>
                      <td className="p-3">
                        <Link to={`/employees/${emp.id}`} className="flex items-center gap-2.5 hover:underline">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052FF] font-black border border-blue-100 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                            {emp.avatar_url ? <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}</span>}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{emp.first_name} {emp.last_name}</span>
                            <span className="text-[10px] text-slate-400">{emp.email}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3 text-slate-500 font-bold capitalize">{emp.gender || '—'}</td>
                      <td className="p-3 font-bold text-slate-700">{emp.department_name || '—'}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                          attStatus === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          attStatus === 'LEAVE' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>{attStatus}</span>
                      </td>
                      <td className="p-3 text-slate-600 font-bold">{emp.job_title || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals carried forward */}
      </div>
    );
  }

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
