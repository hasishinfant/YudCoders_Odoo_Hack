import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getMySalary,
    getMyPayroll,
    getAdminPayroll,
    processPayroll,
    payPayroll,
    cancelPayroll,
    type EmployeeSalary,
    type Payroll
} from '@/services/payroll';
import { getDepartments, type Department } from '@/services/departments';
import PayslipModal from '@/components/payroll/PayslipModal';
import GeneratePayrollModal from '@/components/payroll/GeneratePayrollModal';
import EditSalaryModal from '@/components/payroll/EditSalaryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    DollarSign, 
    Plus, 
    Search, 
    X, 
    Clock, 
    Building2,
    FileText,
    Settings,
    CheckCircle2
} from 'lucide-react';

export default function PayrollPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my' | 'all'>(isAdmin ? 'all' : 'my');

    // Modals
    const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [editSalaryEmpId, setEditSalaryEmpId] = useState<number | null>(null);
    const [editSalaryEmpName, setEditSalaryEmpName] = useState('');

    // My Salary & Payroll State
    const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);
    const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([]);
    const [loadingMy, setLoadingMy] = useState(true);

    // Admin State
    const [adminPayrolls, setAdminPayrolls] = useState<Payroll[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    const loadMyPayroll = async () => {
        setLoadingMy(true);
        try {
            const [salRes, payRes] = await Promise.all([
                getMySalary(),
                getMyPayroll()
            ]);
            setMySalary(salRes.data || null);
            setMyPayrolls(payRes.data || []);
        } catch (err) {
            console.error('Failed to load salary/payroll data', err);
        } finally {
            setLoadingMy(false);
        }
    };

    const loadAdminPayroll = async () => {
        if (!isAdmin) return;
        setAdminLoading(true);
        try {
            const [payRes, deptRes] = await Promise.all([
                getAdminPayroll({
                    q: searchTerm || undefined,
                    department_id: selectedDept,
                    month: selectedMonth,
                    year: selectedYear,
                    status: selectedStatus || undefined
                }),
                getDepartments()
            ]);
            setAdminPayrolls(payRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error('Failed to load admin payroll records', err);
        } finally {
            setAdminLoading(false);
        }
    };

    useEffect(() => {
        loadMyPayroll();
    }, []);

    useEffect(() => {
        if (activeTab === 'all' && isAdmin) {
            const timer = setTimeout(() => {
                loadAdminPayroll();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, searchTerm, selectedDept, selectedMonth, selectedYear, selectedStatus]);

    const handleProcess = async (id: number) => {
        try {
            await processPayroll(id);
            loadAdminPayroll();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to process payroll');
        }
    };

    const handlePay = async (id: number) => {
        try {
            await payPayroll(id);
            loadAdminPayroll();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to mark payroll as paid');
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this payroll record?')) return;
        try {
            await cancelPayroll(id);
            loadAdminPayroll();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to cancel payroll');
        }
    };

    const formatCurrency = (val?: number) => {
        if (val === undefined || val === null) return '₹0.00';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</span>;
            case 'PROCESSED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Processed</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Draft</span>;
        }
    };

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary & Payroll Management</h1>
                    <p className="text-sm text-slate-500 mt-1">View employee compensation, generate monthly payrolls, and access payslips.</p>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                    {/* Admin Actions */}

                    {isAdmin && (
                        <Button 
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 h-10 space-x-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Generate Payroll</span>
                        </Button>
                    )}
                </div>
            </div>

            {activeTab === 'my' ? (
                <div className="space-y-6">
                    {/* Salary Overview Card */}
                    <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-900 text-white p-5">
                            <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                                <span>My Salary Structure</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {mySalary ? (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Basic Salary</span>
                                        <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(mySalary.basic_salary)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Allowances</span>
                                        <span className="font-mono font-bold text-emerald-600 text-sm">{formatCurrency(mySalary.allowances)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Gross Salary</span>
                                        <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(mySalary.gross_salary)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Deductions</span>
                                        <span className="font-mono font-bold text-red-600 text-sm">{formatCurrency(mySalary.deductions)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Net Payable</span>
                                        <span className="font-mono font-black text-emerald-600 text-base">{formatCurrency(mySalary.net_salary)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic">No salary configuration initialized yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Payroll History Table */}
                    <Card className="bg-white border-slate-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-base font-bold text-slate-900">My Payslip History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingMy ? (
                                <div className="p-8 text-center text-slate-400">Loading payroll history...</div>
                            ) : myPayrolls.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No payroll records generated yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Period</th>
                                                <th className="p-3.5">Basic Salary</th>
                                                <th className="p-3.5">Gross Salary</th>
                                                <th className="p-3.5">Deductions</th>
                                                <th className="p-3.5">Net Salary</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5 text-right pr-6">Payslip</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {myPayrolls.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                        {monthNames[p.month - 1]} {p.year}
                                                    </td>
                                                    <td className="p-3.5 font-mono">{formatCurrency(p.basic_salary)}</td>
                                                    <td className="p-3.5 font-mono font-semibold text-emerald-700">{formatCurrency(p.gross_salary)}</td>
                                                    <td className="p-3.5 font-mono text-red-600">{formatCurrency(p.deductions)}</td>
                                                    <td className="p-3.5 font-mono font-bold text-slate-900">{formatCurrency(p.net_salary)}</td>
                                                    <td className="p-3.5">{getStatusBadge(p.status)}</td>
                                                    <td className="p-3.5 text-right pr-6">
                                                        <button
                                                            onClick={() => setSelectedPayslip(p)}
                                                            className="text-slate-900 hover:text-emerald-600 font-bold text-xs flex items-center justify-end space-x-1 ml-auto"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span>View Payslip</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* Admin View */
                <div className="space-y-4">
                    {/* Admin Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input 
                                placeholder="Search employee..." 
                                className="pl-9 h-10 text-xs"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedDept || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedMonth || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Months</option>
                            {monthNames.map((m, idx) => (
                                <option key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                        </select>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedYear || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Years</option>
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </select>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedStatus}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="PROCESSED">PROCESSED</option>
                            <option value="PAID">PAID</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>

                    {/* Admin Payroll Table */}
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-0">
                            {adminLoading ? (
                                <div className="p-8 text-center text-slate-400">Loading payroll records...</div>
                            ) : adminPayrolls.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No payroll records generated yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Employee</th>
                                                <th className="p-3.5">Department</th>
                                                <th className="p-3.5">Period</th>
                                                <th className="p-3.5">Gross</th>
                                                <th className="p-3.5">Deductions</th>
                                                <th className="p-3.5">Net Salary</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {adminPayrolls.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-semibold text-slate-900">
                                                        <div>{p.employee_name || 'N/A'}</div>
                                                        <div className="font-mono text-[10px] text-slate-500 font-normal">{p.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">{p.department_name || 'N/A'}</td>
                                                    <td className="p-3.5 font-bold text-slate-900">{monthNames[p.month - 1]} {p.year}</td>
                                                    <td className="p-3.5 font-mono font-semibold text-emerald-700">{formatCurrency(p.gross_salary)}</td>
                                                    <td className="p-3.5 font-mono text-red-600">{formatCurrency(p.deductions)}</td>
                                                    <td className="p-3.5 font-mono font-bold text-slate-900">{formatCurrency(p.net_salary)}</td>
                                                    <td className="p-3.5">{getStatusBadge(p.status)}</td>
                                                    <td className="p-3.5 text-right pr-6 space-x-1.5">
                                                        {p.status === 'DRAFT' && (
                                                            <button
                                                                onClick={() => handleProcess(p.id)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded transition-colors"
                                                            >
                                                                Process
                                                            </button>
                                                        )}
                                                        {p.status === 'PROCESSED' && (
                                                            <button
                                                                onClick={() => handlePay(p.id)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded transition-colors"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                        {(p.status === 'DRAFT' || p.status === 'PROCESSED') && (
                                                            <button
                                                                onClick={() => handleCancel(p.id)}
                                                                className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-[11px] px-2 py-1 rounded transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setSelectedPayslip(p)}
                                                            className="text-slate-700 hover:text-slate-900 font-semibold text-[11px] underline ml-1"
                                                        >
                                                            Payslip
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditSalaryEmpId(p.employee_id);
                                                                setEditSalaryEmpName(p.employee_name || '');
                                                            }}
                                                            className="text-slate-500 hover:text-slate-800 p-1"
                                                            title="Edit Salary Config"
                                                        >
                                                            <Settings className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modals */}
            <PayslipModal 
                payroll={selectedPayslip}
                isOpen={!!selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
            />

            <GeneratePayrollModal 
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                onSuccess={loadAdminPayroll}
            />

            <EditSalaryModal 
                employeeId={editSalaryEmpId}
                employeeName={editSalaryEmpName}
                isOpen={!!editSalaryEmpId}
                onClose={() => setEditSalaryEmpId(null)}
                onSuccess={loadAdminPayroll}
            />
        </div>
    );
}
