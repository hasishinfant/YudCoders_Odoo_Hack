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
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 h-10 space-x-1.5"
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
                        activeTab === 'employee' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Employee Summary</span>
                </button>

                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Attendance Summary</span>
                </button>

                <button
                    onClick={() => setActiveTab('leave')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'leave' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Leave Summary</span>
                </button>

                <button
                    onClick={() => setActiveTab('payroll')}
                    className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card className="bg-white border-slate-200">
                                    <CardContent className="p-6">
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Headcount</span>
                                        <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_employees}</span>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200">
                                    <CardContent className="p-6">
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Active Workforce</span>
                                        <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{reportData.active_employees}</span>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200">
                                    <CardContent className="p-6">
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Inactive / Offboarded</span>
                                        <span className="text-3xl font-black text-slate-500 font-mono mt-1 block">{reportData.inactive_employees}</span>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Department Breakdown Table */}
                            <Card className="bg-white border-slate-200">
                                <CardHeader className="border-b border-slate-100 pb-3">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                                        <Building2 className="w-4 h-4 text-emerald-600" />
                                        <span>Department Headcount Breakdown</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                                                <th className="p-3.5 pl-6">Department</th>
                                                <th className="p-3.5 text-right pr-6">Employee Count</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(reportData.department_breakdown || []).map((d: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-3.5 pl-6 font-bold text-slate-900">{d.department}</td>
                                                    <td className="p-3.5 text-right pr-6 font-mono font-bold text-slate-800">{d.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Attendance Summary View */}
                    {activeTab === 'attendance' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Logged Days</span>
                                    <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_records}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Present Count</span>
                                    <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{reportData.present_count}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Worked Hours</span>
                                    <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_worked_hours} hrs</span>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Leave Summary View */}
                    {activeTab === 'leave' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Requests</span>
                                    <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{reportData.total_requests}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Approved Requests</span>
                                    <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{reportData.approved_count}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Pending Requests</span>
                                    <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">{reportData.pending_count}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Refused / Cancelled</span>
                                    <span className="text-3xl font-black text-red-600 font-mono mt-1 block">{reportData.refused_count + reportData.cancelled_count}</span>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Payroll Summary View */}
                    {activeTab === 'payroll' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Gross Salary</span>
                                    <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{formatCurrency(reportData.total_gross_salary)}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Deductions</span>
                                    <span className="text-3xl font-black text-red-600 font-mono mt-1 block">{formatCurrency(reportData.total_deductions)}</span>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200">
                                <CardContent className="p-6">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Net Expenditure</span>
                                    <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{formatCurrency(reportData.total_net_salary)}</span>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
