import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, TrendingUp, Star, Target, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, Umbrella } from 'lucide-react';
import { getMyLeaveBalances, type LeaveBalance } from '@/services/leave';
import { getMyAttendance, type AttendanceRecord } from '@/services/attendance';
import { getMySalary, type EmployeeSalary } from '@/services/payroll';

interface PerformanceStats {
    attendancePct: number;
    presentDays: number;
    totalDays: number;
    extraHours: number;
    leaveBalances: LeaveBalance[];
    salary: EmployeeSalary | null;
}

export default function PerformancePage() {
    const [stats, setStats] = useState<PerformanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();

            // Fetch last 3 months of attendance
            const threeMonthsAgo = new Date(year, month - 2, 1);
            const startDate = threeMonthsAgo.toISOString().split('T')[0];
            const today = now.toISOString().split('T')[0];

            const [leaveRes, attendRes, salaryRes] = await Promise.all([
                getMyLeaveBalances(),
                getMyAttendance({ start_date: startDate, end_date: today, limit: 200 }),
                getMySalary()
            ]);

            const leaveBalances: LeaveBalance[] = leaveRes.data || [];
            const attendance: AttendanceRecord[] = attendRes.data || [];
            const salary: EmployeeSalary | null = salaryRes.data || null;

            const presentDays = attendance.filter(r => r.status === 'PRESENT').length;
            const totalDays = attendance.length;
            const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
            const extraHours = attendance.reduce((sum, r) => sum + (r.extra_hours || 0), 0);

            setStats({ attendancePct, presentDays, totalDays, extraHours, leaveBalances, salary });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load performance data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getAttendanceColor = (pct: number) => {
        if (pct >= 90) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        if (pct >= 75) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' };
        return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' };
    };

    const getLeaveUsagePct = (b: LeaveBalance) => {
        if (!b.max_days || b.max_days === 0) return 0;
        return Math.min(100, Math.round((b.used_days / b.max_days) * 100));
    };

    const formatCurrency = (val?: number) => {
        if (!val) return '—';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="border-b border-slate-200/80 pb-5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Performance & Goals</h1>
                    <p className="text-xs text-slate-500 mt-1">Loading your performance data from the system...</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse h-24" />
                    ))}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 animate-pulse h-64" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="border-b border-slate-200/80 pb-5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Performance & Goals</h1>
                </div>
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">{error}</p>
                        <button onClick={loadData} className="text-xs font-bold text-[#0052FF] hover:underline mt-1">Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const attColor = getAttendanceColor(stats.attendancePct);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Performance & Goals</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Live stats from your attendance records, leave balances, and payroll — no dummy data.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Attendance % */}
                <Card className={`${attColor.bg} border ${attColor.border} rounded-2xl shadow-sm`}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center">
                                <CheckCircle2 className={`w-5 h-5 ${attColor.text}`} />
                            </div>
                            <span className={`text-[10px] font-black uppercase ${attColor.text}`}>
                                {stats.attendancePct >= 90 ? 'EXCELLENT' : stats.attendancePct >= 75 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                            </span>
                        </div>
                        <span className={`text-3xl font-black ${attColor.text}`}>{stats.attendancePct}%</span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Attendance Rate</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{stats.presentDays} present / {stats.totalDays} working days (last 3 months)</p>
                    </CardContent>
                </Card>

                {/* Extra Hours */}
                <Card className="bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-[#0052FF]" />
                        </div>
                        <span className="text-3xl font-black text-[#0052FF]">{Number(stats.extraHours).toFixed(1)}</span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Extra Hours Logged</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Total overtime in last 3 months</p>
                    </CardContent>
                </Card>

                {/* Salary */}
                <Card className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="w-9 h-9 rounded-xl bg-white/70 border border-slate-200 flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">
                            {stats.salary ? formatCurrency(stats.salary.gross_salary) : '—'}
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Gross Monthly Salary</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Net: {formatCurrency(stats.salary?.net_salary)}</p>
                    </CardContent>
                </Card>

                {/* Leave Summary */}
                <Card className="bg-orange-50 border border-orange-100 rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center mb-3">
                            <Umbrella className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-3xl font-black text-orange-700">
                            {stats.leaveBalances.reduce((sum, b) => sum + b.remaining_days, 0)}
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Leave Remaining</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Across all {stats.leaveBalances.length} leave type(s)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Leave Balance Breakdown */}
            {stats.leaveBalances.length > 0 && (
                <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#0052FF]" />
                        <h3 className="font-black text-base text-slate-900">Leave Balance Tracker</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {stats.leaveBalances.map((b) => {
                            const pct = getLeaveUsagePct(b);
                            const remaining = b.remaining_days;
                            const barColor = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
                            return (
                                <div key={b.leave_type_id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="space-y-1 md:min-w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black text-slate-800">{b.leave_type_name}</h4>
                                            {b.paid && (
                                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">PAID</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Used <strong className="text-slate-700">{b.used_days}</strong> of <strong className="text-slate-700">{b.max_days}</strong> days
                                            &nbsp;·&nbsp; <span className={`font-bold ${remaining <= 2 ? 'text-red-600' : 'text-emerald-700'}`}>{remaining} remaining</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 font-mono w-8 text-right">{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Attendance Heatmap Summary */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#0052FF]" />
                    <h3 className="font-black text-base text-slate-900">Attendance Overview (Last 3 Months)</h3>
                </div>
                <div className="p-6">
                    {stats.totalDays === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">No attendance data available for the last 3 months.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Present', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', value: stats.presentDays },
                                { label: 'Absent', icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', value: stats.totalDays - stats.presentDays },
                                { label: 'Extra Hours', icon: Clock, color: 'text-[#0052FF]', bg: 'bg-blue-50', border: 'border-blue-100', value: `${Number(stats.extraHours).toFixed(1)}h` },
                                { label: 'Attendance Rate', icon: Star, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', value: `${stats.attendancePct}%` },
                            ].map(({ label, icon: Icon, color, bg, border, value }) => (
                                <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
                                    <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                                    <span className={`text-lg font-black ${color}`}>{value}</span>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Salary Details Card (if data present) */}
            {stats.salary && (
                <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#0052FF]" />
                        <h3 className="font-black text-base text-slate-900">Compensation Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        {[
                            { label: 'Basic Salary', value: formatCurrency(stats.salary.basic_salary) },
                            { label: 'Allowances', value: formatCurrency(stats.salary.allowances) },
                            { label: 'Gross Salary', value: formatCurrency(stats.salary.gross_salary) },
                            { label: 'Net Salary', value: formatCurrency(stats.salary.net_salary) },
                        ].map(item => (
                            <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <span className="text-sm font-black text-slate-900">{item.value}</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
