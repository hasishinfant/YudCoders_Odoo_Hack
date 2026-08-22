import { useState, useEffect } from 'react';
import {
    getEmployeeReport,
    getAttendanceReport,
    getLeaveReport,
    getPayrollReport,
    exportReportCsv
} from '@/services/reports';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Download, 
    Users, 
    Clock, 
    Calendar, 
    DollarSign,
    Building2
} from 'lucide-react';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'employee' | 'attendance' | 'leave' | 'payroll'>('employee');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadReport = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'employee') res = await getEmployeeReport();
            else if (activeTab === 'attendance') res = await getAttendanceReport();
            else if (activeTab === 'leave') res = await getLeaveReport();
            else if (activeTab === 'payroll') res = await getPayrollReport();

            setReportData(res?.data || null);
        } catch (err) {
            console.error('Failed to load report data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, [activeTab]);

    const handleExport = async () => {
        try {
            await exportReportCsv(activeTab);
        } catch (err) {
            alert('Failed to export CSV report');
        }
    };

    const formatCurrency = (val?: number) => {
        if (!val) return '₹0.00';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Analytics & Reports</h1>
                    <p className="text-sm text-slate-500 mt-1">Executive summaries across headcount, attendance, leave entitlements, and payroll expenditure.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <Button 
                        onClick={handleExport}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs px-4 h-10 space-x-1.5 rounded-xl shadow-md"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 space-x-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('employee')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'employee' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-[#0052FF]'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Employee Summary</span>
                </button>

                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'attendance' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-[#0052FF]'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Attendance Summary</span>
                </button>

                <button
                    onClick={() => setActiveTab('leave')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'leave' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-[#0052FF]'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Leave Summary</span>
                </button>

                <button
                    onClick={() => setActiveTab('payroll')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'payroll' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-[#0052FF]'
                    }`}
                >
                    <DollarSign className="w-4 h-4" />
                    <span>Payroll Expenditure</span>
                </button>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="p-12 text-center text-slate-400">Loading report metrics...</div>
            ) : !reportData ? (
                <div className="p-12 text-center text-slate-500">No report data available.</div>
            ) : (
                <div className="space-y-6">
                    {/* Employee Summary View */}
                    {activeTab === 'employee' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Total Headcount</span>
                                            <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_employees}</span>
                                        </div>
                                        <div className="p-3 bg-blue-50 text-[#0052FF] rounded-xl">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Active Workforce</span>
                                            <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{reportData.active_employees}</span>
                                        </div>
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Inactive / Offboarded</span>
                                            <span className="text-3xl font-black text-slate-500 font-mono mt-1 block">{reportData.inactive_employees}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 text-slate-500 rounded-xl">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Department Breakdown Table */}
                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 pb-3">
                                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                            <Building2 className="w-4 h-4 text-[#0052FF]" />
                                            <span>Department Distribution</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold uppercase">
                                                    <th className="p-3.5 pl-6">Department</th>
                                                    <th className="p-3.5 text-right pr-6">Employee Count</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(reportData.department_breakdown || []).map((d: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="p-3.5 pl-6 font-bold text-slate-800">{d.department}</td>
                                                        <td className="p-3.5 text-right pr-6 font-mono font-black text-slate-900">{d.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>

                                {/* Recent Onboardings List */}
                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
                                    <CardHeader className="border-b border-slate-100 pb-3">
                                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                            <Users className="w-4 h-4 text-indigo-600" />
                                            <span>Recent Employee Onboardings</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-3.5">
                                        {!reportData.recent_hires || reportData.recent_hires.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic text-center py-4">No recent hires registered.</p>
                                        ) : (
                                            reportData.recent_hires.map((emp: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                    <div>
                                                        <h5 className="font-bold text-slate-800">{emp.name}</h5>
                                                        <p className="text-[10px] text-slate-400 font-semibold">{emp.job_title} • {emp.department || 'Unassigned'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black font-mono bg-blue-50 text-[#0052FF] px-2 py-0.5 rounded border border-blue-100 uppercase">{emp.employee_code}</span>
                                                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Joined {emp.joining_date}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Attendance Summary View */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Logged Days</span>
                                            <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_records}</span>
                                        </div>
                                        <div className="p-3 bg-blue-50 text-[#0052FF] rounded-xl">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Present Count</span>
                                            <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{reportData.present_count}</span>
                                        </div>
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Worked Hours</span>
                                            <span className="text-3xl font-black text-indigo-600 font-mono mt-1 block">{reportData.total_worked_hours} hrs</span>
                                        </div>
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-6">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Workforce Presence Rate</h4>
                                <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-800">
                                    <span>Presence Efficiency</span>
                                    <span className="text-[#0052FF]">{Math.round((reportData.present_count / (reportData.total_records || 1)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full mt-2 overflow-hidden border border-slate-200">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-[#0052FF] h-full rounded-full transition-all"
                                        style={{ width: `${Math.round((reportData.present_count / (reportData.total_records || 1)) * 100)}%` }}
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Leave Summary View */}
                    {activeTab === 'leave' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-5">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Requests</span>
                                    <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_requests}</span>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-5">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Approved Requests</span>
                                    <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{reportData.approved_count}</span>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-5">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Pending Requests</span>
                                    <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">{reportData.pending_count}</span>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-5">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Refused / Cancelled</span>
                                    <span className="text-3xl font-black text-red-600 font-mono mt-1 block">{reportData.refused_count + reportData.cancelled_count}</span>
                                </Card>
                            </div>

                            <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-6">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Leave Approvals Efficiency Ratio</h4>
                                <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-800">
                                    <span>Approval Ratio</span>
                                    <span className="text-emerald-600">{Math.round((reportData.approved_count / (reportData.total_requests || 1)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full mt-2 overflow-hidden border border-slate-200">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all"
                                        style={{ width: `${Math.round((reportData.approved_count / (reportData.total_requests || 1)) * 100)}%` }}
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Payroll Summary View */}
                    {activeTab === 'payroll' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Gross Salary</span>
                                    <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{formatCurrency(reportData.total_gross_salary)}</span>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Deductions</span>
                                    <span className="text-3xl font-black text-red-600 font-mono mt-1 block">{formatCurrency(reportData.total_deductions)}</span>
                                </Card>

                                <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Net Expenditure</span>
                                    <span className="text-3xl font-black text-[#0052FF] font-mono mt-1 block">{formatCurrency(reportData.total_net_salary)}</span>
                                </Card>
                            </div>

                            <Card className="bg-white border-slate-200 shadow-xs rounded-2xl p-6">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Payroll Composition</h4>
                                <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-800">
                                    <span>Net Payout Ratio</span>
                                    <span className="text-[#0052FF]">{Math.round((reportData.total_net_salary / (reportData.total_gross_salary || 1)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full mt-2 overflow-hidden border border-slate-200">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-[#0052FF] h-full rounded-full transition-all"
                                        style={{ width: `${Math.round((reportData.total_net_salary / (reportData.total_gross_salary || 1)) * 100)}%` }}
                                    />
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
