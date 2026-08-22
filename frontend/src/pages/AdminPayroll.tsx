import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getAdminPayroll,
    processPayroll,
    payPayroll,
    cancelPayroll,
    type Payroll
} from '@/services/payroll';
import { getDepartments, type Department } from '@/services/departments';
import PayslipModal from '@/components/payroll/PayslipModal';
import GeneratePayrollModal from '@/components/payroll/GeneratePayrollModal';
import EditSalaryModal from '@/components/payroll/EditSalaryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Plus, 
    Search, 
    Building2,
    Settings
} from 'lucide-react';

export default function AdminPayrollPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    // Modals
    const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [editSalaryEmpId, setEditSalaryEmpId] = useState<number | null>(null);
    const [editSalaryEmpName, setEditSalaryEmpName] = useState('');

    // Admin State
    const [adminPayrolls, setAdminPayrolls] = useState<Payroll[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

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
        loadAdminPayroll();
    }, [searchTerm, selectedDept, selectedMonth, selectedYear, selectedStatus]);

    const handleProcessPayroll = async (id: number) => {
        if (!confirm('Are you sure you want to process this payroll record?')) return;
        try {
            await processPayroll(id);
            loadAdminPayroll();
        } catch (err) {
            console.error('Failed to process payroll', err);
        }
    };

    const handlePayPayroll = async (id: number) => {
        if (!confirm('Mark this payroll record as PAID?')) return;
        try {
            await payPayroll(id);
            loadAdminPayroll();
        } catch (err) {
            console.error('Failed to mark payroll as paid', err);
        }
    };

    const handleCancelPayroll = async (id: number) => {
        if (!confirm('Cancel this payroll run record?')) return;
        try {
            await cancelPayroll(id);
            loadAdminPayroll();
        } catch (err) {
            console.error('Failed to cancel payroll', err);
        }
    };

    const formatCurrency = (val?: number) => {
        if (!val) return '—';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const getStatusBadge = (status: string) => {
        const base = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border';
        switch (status) {
            case 'PAID':
                return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-700`}>Paid</span>;
            case 'PROCESSED':
                return <span className={`${base} bg-blue-50 border-blue-200 text-[#0052FF]`}>Processed</span>;
            case 'CANCELLED':
                return <span className={`${base} bg-slate-50 border-slate-200 text-slate-500`}>Cancelled</span>;
            default:
                return <span className={`${base} bg-amber-50 border-amber-200 text-amber-700`}>Draft</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payroll Operations</h1>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            HR ADMIN OVERSIGHT
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Manage corporate salary settings, run bulk monthly payroll distributions, and issue payslips.</p>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
                    <Button 
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-black text-xs px-4 h-10 space-x-1.5 rounded-xl shadow-md"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Run Monthly Payroll</span>
                    </Button>
                </div>
            </div>

            {/* Admin Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <Input 
                        placeholder="Search employee..." 
                        className="pl-9 h-10 text-xs rounded-xl"
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                    value={selectedDept || ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                <select
                    className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                    value={selectedMonth || ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>

                <select
                    className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                    value={selectedYear || ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                </select>

                <select
                    className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
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

            {/* Admin Payroll Grid */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {adminLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading payroll history...</div>
                    ) : adminPayrolls.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 space-y-2">
                            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-sm">No payroll distribution history found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                        <th className="p-3.5 pl-6">Employee</th>
                                        <th className="p-3.5">Salary Period</th>
                                        <th className="p-3.5">Worked Hours</th>
                                        <th className="p-3.5">Gross Pay</th>
                                        <th className="p-3.5">Deductions</th>
                                        <th className="p-3.5">Net Payout</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5 text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {adminPayrolls.map(pay => (
                                        <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                <div>{pay.employee_name || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-500 font-mono font-normal">
                                                    Code: {pay.employee_code || 'N/A'} • {pay.department_name}
                                                </div>
                                            </td>
                                            <td className="p-3.5 font-medium">
                                                {new Date(2000, pay.month - 1, 1).toLocaleString('default', { month: 'short' })} {pay.year}
                                            </td>
                                            <td className="p-3.5 font-mono text-slate-900 font-bold">
                                                {pay.worked_hours ? `${pay.worked_hours.toFixed(1)}h` : '--'}
                                            </td>
                                            <td className="p-3.5 font-semibold text-slate-900">{formatCurrency(pay.gross_salary)}</td>
                                            <td className="p-3.5 text-red-600 font-medium">{formatCurrency(pay.deductions)}</td>
                                            <td className="p-3.5 font-black text-slate-900">{formatCurrency(pay.net_salary)}</td>
                                            <td className="p-3.5">{getStatusBadge(pay.status)}</td>
                                            <td className="p-3.5 text-right pr-6 space-x-1">
                                                <div className="flex justify-end items-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedPayslip(pay)}
                                                        className="text-[#0052FF] hover:underline font-bold text-[11px] px-2 py-1 bg-blue-50 border border-blue-100 rounded-md"
                                                    >
                                                        Payslip
                                                    </button>
                                                    
                                                    {pay.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleProcessPayroll(pay.id)}
                                                                className="bg-[#0052FF] text-white hover:bg-blue-700 font-bold text-[11px] px-2.5 py-1 rounded-md"
                                                            >
                                                                Process
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditSalaryEmpId(pay.employee_id);
                                                                    setEditSalaryEmpName(pay.employee_name || '');
                                                                }}
                                                                className="text-slate-600 hover:text-slate-900 p-1 bg-slate-50 border border-slate-200 rounded-md"
                                                                title="Configure Salary Config"
                                                            >
                                                                <Settings className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {pay.status === 'PROCESSED' && (
                                                        <button
                                                            onClick={() => handlePayPayroll(pay.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}

                                                    {pay.status !== 'PAID' && pay.status !== 'CANCELLED' && (
                                                        <button
                                                            onClick={() => handleCancelPayroll(pay.id)}
                                                            className="text-red-600 hover:text-red-800 font-bold text-[11px] px-2 py-1 bg-red-50 border border-red-100 rounded-md"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

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
