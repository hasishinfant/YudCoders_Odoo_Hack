import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getMySalary,
    getMyPayroll,
    type EmployeeSalary,
    type Payroll
} from '@/services/payroll';
import PayslipModal from '@/components/payroll/PayslipModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    DollarSign, 
    FileText
} from 'lucide-react';

export default function PayrollPage() {
    useAuth();

    // Modals
    const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

    // My Salary & Payroll State
    const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);
    const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([]);
    const [loadingMy, setLoadingMy] = useState(true);

    const loadMyPayroll = async () => {
        setLoadingMy(true);
        try {
            const [salRes, payRes] = await Promise.all([
                getMySalary().catch(() => ({ data: null })),
                getMyPayroll().catch(() => ({ data: [] }))
            ]);
            setMySalary(salRes?.data || null);
            setMyPayrolls(payRes?.data || []);
        } catch (err) {
            console.error('Failed to load salary/payroll data', err);
        } finally {
            setLoadingMy(false);
        }
    };

    useEffect(() => {
        loadMyPayroll();
    }, []);

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
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Compensation & Payslips</h1>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#0052FF]">
                            EMPLOYEE PORTAL
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Access monthly payouts detail ledger statements, basic allowances structure, and printable payslip downloads.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Active Salary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md border-0 p-6 relative overflow-hidden">
                        <div className="absolute right-4 top-4 text-white/10">
                            <DollarSign className="w-24 h-24 stroke-[1]" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-1">Gross Salary Structure</span>
                        <span className="text-3xl font-black">{mySalary ? formatCurrency(mySalary.gross_salary) : '—'}</span>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-slate-300">
                            <div>Basic: {mySalary ? formatCurrency(mySalary.basic_salary) : '—'}</div>
                            <div>Allowances: {mySalary ? formatCurrency(mySalary.allowances) : '—'}</div>
                        </div>
                    </Card>

                    <Card className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-1">Deductions Config</span>
                        <span className="text-2xl font-black text-red-600">
                            {mySalary ? formatCurrency(mySalary.deductions) : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">PF, Insurance, Professional Tax</span>
                    </Card>

                    <Card className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex flex-col justify-center">
                        <span className="text-xs font-bold text-blue-500 block uppercase tracking-wider mb-1">Net Monthly Salary Payout</span>
                        <span className="text-3xl font-black text-[#0052FF]">
                            {mySalary ? formatCurrency(mySalary.net_salary) : '—'}
                        </span>
                        <span className="text-[10px] text-blue-400 font-bold mt-1">Net pay = Gross salary - Deductions</span>
                    </Card>
                </div>

                {/* Salary Slips Table */}
                <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-black text-slate-900">Payslip Statements History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingMy ? (
                            <div className="p-8 text-center text-slate-400">Loading payroll history...</div>
                        ) : myPayrolls.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 space-y-2">
                                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-semibold text-sm">No payroll entries issued yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                            <th className="p-3.5 pl-6">Payout Period</th>
                                            <th className="p-3.5">Gross Pay</th>
                                            <th className="p-3.5">Deductions</th>
                                            <th className="p-3.5">Net Pay</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5 text-right pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {myPayrolls.map(pay => (
                                            <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                    {new Date(2000, pay.month - 1, 1).toLocaleString('default', { month: 'long' })} {pay.year}
                                                </td>
                                                <td className="p-3.5 font-semibold">{formatCurrency(pay.gross_salary)}</td>
                                                <td className="p-3.5 text-red-600 font-medium">{formatCurrency(pay.deductions)}</td>
                                                <td className="p-3.5 font-bold text-slate-900">{formatCurrency(pay.net_salary)}</td>
                                                <td className="p-3.5">{getStatusBadge(pay.status)}</td>
                                                <td className="p-3.5 text-right pr-6">
                                                    <button
                                                        onClick={() => setSelectedPayslip(pay)}
                                                        className="text-[#0052FF] hover:underline font-bold text-xs"
                                                    >
                                                        View Payslip
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

            {/* Payslip Modal */}
            <PayslipModal 
                payroll={selectedPayslip}
                isOpen={!!selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
            />
        </div>
    );
}
