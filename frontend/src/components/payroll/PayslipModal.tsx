import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Payroll } from '@/services/payroll';
import { Printer, X, FileText, Clock, DollarSign, Calendar } from 'lucide-react';

interface PayslipModalProps {
    payroll: Payroll | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function PayslipModal({ payroll, isOpen, onClose }: PayslipModalProps) {
    if (!isOpen || !payroll) return null;

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthStr = monthNames[payroll.month - 1] || `Month ${payroll.month}`;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200 my-8">
                {/* Modal Header */}
                <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between space-y-0 print:hidden">
                    <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <span>Employee Payslip — {monthStr} {payroll.year}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.print()} 
                            className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-semibold space-x-1.5 h-8"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                        </Button>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </CardHeader>

                {/* Printable Payslip Body */}
                <CardContent className="p-8 space-y-6">
                    {/* Payslip Header Info */}
                    <div className="border-b border-slate-200 pb-6 flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="bg-slate-900 text-white w-7 h-7 rounded flex items-center justify-center font-black text-xs">D</span>
                                <span className="text-xl font-bold tracking-tight text-slate-900">Dayflow HRMS</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Official Salary Slip & Statement</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Payroll Period</span>
                            <span className="text-base font-bold text-slate-900">{monthStr} {payroll.year}</span>
                            <span className="text-[11px] text-slate-500 block font-mono">({payroll.period_start} to {payroll.period_end})</span>
                        </div>
                    </div>

                    {/* Employee Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                            <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">Employee Name</span>
                            <span className="font-bold text-slate-900">{payroll.employee_name || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">Employee Code</span>
                            <span className="font-mono font-bold text-slate-800">{payroll.employee_code || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">Department</span>
                            <span className="font-bold text-slate-800">{payroll.department_name || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">Payroll Status</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                payroll.status === 'PROCESSED' ? 'bg-blue-100 text-blue-800' :
                                payroll.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                            }`}>
                                {payroll.status}
                            </span>
                        </div>
                    </div>

                    {/* Attendance & Leave Summary */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>Worked Hours: <strong className="font-mono text-slate-900">{payroll.worked_hours || 0} hrs</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Paid Leave Days: <strong className="font-mono text-slate-900">{payroll.approved_leave_days || 0} days</strong></span>
                        </div>
                    </div>

                    {/* Earnings & Deductions Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Earnings */}
                        <div className="border border-slate-200 rounded-xl p-4 bg-white">
                            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 text-emerald-700 flex items-center">
                                <DollarSign className="w-4 h-4 mr-1 text-emerald-600" /> Earnings
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Basic Salary</span>
                                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(payroll.basic_salary)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Allowances</span>
                                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(payroll.allowances)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                                    <span>Gross Salary</span>
                                    <span className="font-mono text-emerald-700">{formatCurrency(payroll.gross_salary)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="border border-slate-200 rounded-xl p-4 bg-white">
                            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 text-red-700 flex items-center">
                                <DollarSign className="w-4 h-4 mr-1 text-red-600" /> Deductions
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Standard Deductions</span>
                                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(payroll.deductions)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                                    <span>Total Deductions</span>
                                    <span className="font-mono text-red-700">{formatCurrency(payroll.deductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary Highlight */}
                    <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Net Payable Salary</span>
                            <span className="text-[11px] text-slate-400">Total Take-Home Pay</span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black font-mono text-emerald-400 block">{formatCurrency(payroll.net_salary)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
