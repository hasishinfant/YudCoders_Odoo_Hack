import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getMyPayroll,
    type Payroll
} from '@/services/payroll';
import { Card } from '@/components/ui/card';
import { 
    Download, 
    Calendar, 
    ArrowRight, 
    DollarSign, 
    Wallet, 
    FileText, 
    Coins,
    ShieldAlert,
    TrendingDown,
    Building
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function PayrollPage() {
    const { user } = useAuth();

    // My Salary & Payroll State
    const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [finYear, setFinYear] = useState('FY 2024-25');

    const loadMyPayroll = async () => {
        setLoading(true);
        try {
            const payRes = await getMyPayroll();
            const payrollsList = payRes?.data || [];
            setMyPayrolls(payrollsList);
            if (payrollsList.length > 0) {
                setSelectedPayroll(payrollsList[0]); // Default to latest
            }
        } catch (err) {
            console.error('Failed to load salary/payroll data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyPayroll();
    }, []);

    const formatCurrency = (val?: number) => {
        if (val === undefined || val === null) return '₹ 0.00';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    // Calculate days to next payroll
    const getDaysToNextPayroll = () => {
        const today = new Date();
        const nextPayrollDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of current month
        const diffTime = nextPayrollDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            dateStr: nextPayrollDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            daysLeft: diffDays
        };
    };

    const nextPayrollInfo = getDaysToNextPayroll();

    // Helper for number to words (simple Indian format for our values)
    const numberToWords = (num: number) => {
        if (!num) return '';
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        const g = (n: number): string => {
            if (n < 20) return a[n];
            const digit = n % 10;
            return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
        };
        
        const kh = Math.floor(num / 100000);
        const th = Math.floor((num % 100000) / 1000);
        const h = Math.floor((num % 1000) / 100);
        const t = num % 100;
        
        let str = '';
        if (kh) str += g(kh) + ' Lakh ';
        if (th) str += g(th) + ' Thousand ';
        if (h) str += g(h) + ' Hundred ';
        if (t) str += g(t);
        
        return 'Rupees ' + str.trim() + ' Only';
    };

    // Get breakdowns
    const getEarningsBreakdown = (basic: number = 0, allowances: number = 0) => {
        return [
            { name: 'Basic Salary', val: basic },
            { name: 'House Rent Allowance (HRA)', val: allowances * 0.5 },
            { name: 'Conveyance Allowance', val: allowances * 0.1 },
            { name: 'Special Allowance', val: allowances * 0.3 },
            { name: 'Performance Bonus', val: allowances * 0.05 },
            { name: 'Other Allowances', val: allowances * 0.05 }
        ];
    };

    const getDeductionsBreakdown = (deductions: number = 0) => {
        return [
            { name: 'Provident Fund (PF)', val: deductions * 0.3 },
            { name: 'Professional Tax', val: 200 },
            { name: 'Income Tax (TDS)', val: deductions * 0.4 },
            { name: 'Health Insurance', val: deductions * 0.15 },
            { name: 'ESI', val: deductions * 0.05 },
            { name: 'Other Deductions', val: Math.max(0, deductions - (deductions * (0.3 + 0.4 + 0.15 + 0.05) + 200)) }
        ];
    };

    const activeEarnings = selectedPayroll ? getEarningsBreakdown(selectedPayroll.basic_salary, selectedPayroll.allowances) : [];
    const activeDeductions = selectedPayroll ? getDeductionsBreakdown(selectedPayroll.deductions) : [];

    // Recharts Data
    const deductionsChartData = selectedPayroll ? [
        { name: 'Income Tax', value: selectedPayroll.deductions * 0.4, color: '#0052FF' },
        { name: 'PF', value: selectedPayroll.deductions * 0.3, color: '#10B981' },
        { name: 'Health Insurance', value: selectedPayroll.deductions * 0.15, color: '#F59E0B' },
        { name: 'ESI', value: selectedPayroll.deductions * 0.05, color: '#EC4899' },
        { name: 'Other', value: Math.max(1, selectedPayroll.deductions * 0.1), color: '#6366F1' }
    ] : [];

    const handleDownloadAll = () => {
        alert("Downloading all payslips for financial year...");
    };

    const handleDownloadSingle = (p: Payroll) => {
        alert(`Downloading payslip for ${new Date(2000, p.month - 1, 1).toLocaleString('default', { month: 'long' })} ${p.year}...`);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto text-slate-700 bg-slate-50/50 p-4 rounded-3xl border border-slate-200">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payroll</h1>
                    <p className="text-xs text-slate-500 font-medium">View your salary details, payslips, deductions and payment history.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                        <span className="text-slate-400 mr-2">Financial Year</span>
                        <select 
                            value={finYear} 
                            onChange={(e) => setFinYear(e.target.value)}
                            className="bg-transparent focus:outline-none cursor-pointer"
                        >
                            <option value="FY 2024-25">FY 2024-25</option>
                            <option value="FY 2025-26">FY 2025-26</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleDownloadAll}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-blue-500/10 flex items-center space-x-1.5 transition-all"
                    >
                        <Download className="w-4 h-4 text-white" />
                        <span>Download All Payslips</span>
                    </button>
                </div>
            </div>

            {/* Top row cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Next Payroll */}
                <Card className="bg-[#0052FF] text-white rounded-2xl p-5 border-0 relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Next Payroll</span>
                        <h2 className="text-xl font-black mt-1">{nextPayrollInfo.dateStr}</h2>
                        <span className="text-[10px] text-blue-100">In {nextPayrollInfo.daysLeft} Days</span>
                    </div>
                    <button className="text-[10px] font-bold text-white flex items-center space-x-1 mt-4 hover:underline">
                        <span>View Payroll Calendar</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </Card>

                {/* 2. Net Pay */}
                <Card className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-2xs">
                    <div>
                        <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-50 text-[#0052FF] rounded-lg"><Wallet className="w-4 h-4" /></div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Net Pay (Take Home)</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mt-2">
                            {formatCurrency(selectedPayroll?.net_salary)}
                        </h2>
                        {selectedPayroll && (
                            <span className="text-[9px] text-slate-400 font-medium">Credited on {selectedPayroll.paid_at ? new Date(selectedPayroll.paid_at).toLocaleDateString('en-IN') : 'Month End'}</span>
                        )}
                    </div>
                    <div className="mt-2">
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                            {selectedPayroll?.status || 'PAID'}
                        </span>
                    </div>
                </Card>

                {/* 3. Gross Salary */}
                <Card className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-2xs">
                    <div>
                        <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><DollarSign className="w-4 h-4" /></div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Gross Salary</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mt-2">
                            {formatCurrency(selectedPayroll?.gross_salary)}
                        </h2>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                        This Month ({selectedPayroll ? new Date(2000, selectedPayroll.month - 1, 1).toLocaleString('default', { month: 'short' }) : '—'} {selectedPayroll?.year})
                    </span>
                </Card>

                {/* 4. Total Deductions */}
                <Card className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-2xs">
                    <div>
                        <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg"><TrendingDown className="w-4 h-4" /></div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</span>
                        </div>
                        <h2 className="text-2xl font-black text-red-600 mt-2">
                            {formatCurrency(selectedPayroll?.deductions)}
                        </h2>
                    </div>
                    {selectedPayroll && (
                        <span className="text-[10px] text-slate-400 font-medium">
                            {((selectedPayroll.deductions / (selectedPayroll.gross_salary || 1)) * 100).toFixed(2)}% of Gross
                        </span>
                    )}
                </Card>

                {/* 5. Total Earnings */}
                <Card className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-2xs">
                    <div>
                        <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Coins className="w-4 h-4" /></div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Earnings</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mt-2">
                            {formatCurrency(selectedPayroll?.gross_salary)}
                        </h2>
                    </div>
                    <button className="text-[10px] font-bold text-[#0052FF] flex items-center space-x-1 hover:underline">
                        <span>View breakdown</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </Card>

                {/* 6. Taxes Deducted */}
                <Card className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-2xs">
                    <div>
                        <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><ShieldAlert className="w-4 h-4" /></div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Taxes Deducted (TDS)</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mt-2">
                            {formatCurrency(selectedPayroll ? selectedPayroll.deductions * 0.4 : 0)}
                        </h2>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">YTD (FY 2024-25)</span>
                </Card>
            </div>

            {/* Main Columns layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT: Payslip History (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Payslip History</h3>
                            <div className="text-[10px] text-slate-400 font-bold bg-slate-50 border px-2 py-0.5 rounded-lg">All Months</div>
                        </div>
                        <div className="p-2 space-y-1">
                            {loading ? (
                                <p className="p-4 text-center text-xs text-slate-400">Loading history...</p>
                            ) : myPayrolls.length === 0 ? (
                                <p className="p-4 text-center text-xs text-slate-400">No records found.</p>
                            ) : (
                                myPayrolls.map(p => {
                                    const monthLabel = new Date(2000, p.month - 1, 1).toLocaleString('default', { month: 'short' });
                                    const isActive = selectedPayroll?.id === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPayroll(p)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                                                isActive ? 'bg-blue-50/50 border-blue-200 text-slate-900 font-bold' : 'border-transparent hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="text-left">
                                                <div className="text-xs font-bold text-slate-800">{monthLabel} {p.year}</div>
                                                <span className="text-[10px] text-slate-400 font-mono font-medium">{formatCurrency(p.net_salary)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                                    p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {p.status}
                                                </span>
                                                <Download 
                                                    className="w-3.5 h-3.5 text-slate-400 hover:text-[#0052FF]" 
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadSingle(p); }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* MIDDLE: Payslip Detail Form View (6 cols) */}
                <div className="lg:col-span-6">
                    {selectedPayroll ? (
                        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                            {/* Card Header details */}
                            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-lg font-black text-slate-900">
                                            Payslip for {new Date(2000, selectedPayroll.month - 1, 1).toLocaleString('default', { month: 'long' })} {selectedPayroll.year}
                                        </h2>
                                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                            {selectedPayroll.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Corporate statement issued on {new Date(selectedPayroll.created_at).toLocaleDateString('en-IN')}</p>
                                </div>
                                <button 
                                    onClick={() => handleDownloadSingle(selectedPayroll)}
                                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs h-9 px-3 rounded-xl flex items-center space-x-1.5 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Download Payslip</span>
                                </button>
                            </div>

                            {/* Employee Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-100">
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Employee Name</span>
                                    <span className="font-bold text-slate-800">{user?.email?.split('@')[0].toUpperCase() || 'Kaaysha Rao'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Department</span>
                                    <span className="font-bold text-slate-800">{selectedPayroll.department_name || 'AI & Data Science'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Date of Joining</span>
                                    <span className="font-bold text-slate-800 font-mono">01 Aug 2023</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Employee ID</span>
                                    <span className="font-bold text-slate-800 font-mono">{selectedPayroll.employee_code || 'EMP00123'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Designation</span>
                                    <span className="font-bold text-slate-800">AI Engineer</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Payment Date</span>
                                    <span className="font-bold text-slate-800 font-mono">
                                        {selectedPayroll.paid_at ? new Date(selectedPayroll.paid_at).toLocaleDateString('en-IN') : '30 Apr 2025'}
                                    </span>
                                </div>
                            </div>

                            {/* Earnings & Deductions Tables */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Earnings Column */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b pb-2 mb-2">
                                        <span>Earnings</span>
                                        <span className="text-emerald-600">{formatCurrency(selectedPayroll.gross_salary)}</span>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        {activeEarnings.map(item => (
                                            <div key={item.name} className="flex justify-between items-center text-slate-600">
                                                <span>{item.name}</span>
                                                <span className="font-mono text-slate-800 font-medium">{formatCurrency(item.val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Deductions Column */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b pb-2 mb-2">
                                        <span>Deductions</span>
                                        <span className="text-red-500">{formatCurrency(selectedPayroll.deductions)}</span>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        {activeDeductions.map(item => (
                                            <div key={item.name} className="flex justify-between items-center text-slate-600">
                                                <span>{item.name}</span>
                                                <span className="font-mono text-slate-800 font-medium">{formatCurrency(item.val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bank details transaction footer */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-1.5 bg-blue-100 text-[#0052FF] rounded-lg"><Building className="w-4.5 h-4.5" /></div>
                                        <div>
                                            <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Net Pay (Take Home)</span>
                                            <span className="text-base font-black text-slate-900 mt-1 block">
                                                {formatCurrency(selectedPayroll.net_salary)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Amount Credited to Bank</span>
                                        <span className="text-[11px] font-bold text-slate-800 mt-1 block font-mono">XXXX XXXX XXXX 1234</span>
                                        <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">HDFC Bank</span>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Payment Date</span>
                                        <span className="text-[11px] font-bold text-slate-800 mt-1 block font-mono">
                                            {selectedPayroll.paid_at ? new Date(selectedPayroll.paid_at).toLocaleDateString('en-IN') : '30 Apr 2025'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold italic">
                                    {numberToWords(selectedPayroll.net_salary)}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center text-slate-400">
                            Select a month from the left history to view detailed payslip statement.
                        </Card>
                    )}
                </div>

                {/* RIGHT: Payment Summary & Doughnut Chart (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* 1. Payment Summary */}
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Payment Summary</h3>
                            <button className="text-[10px] font-bold text-[#0052FF] hover:underline">View Details</button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Bank Name</span>
                                <span className="font-bold text-slate-800">HDFC Bank</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Account Number</span>
                                <span className="font-bold text-slate-800 font-mono">XXXX XXXX XXXX 1234</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">IFSC Code</span>
                                <span className="font-bold text-slate-800 font-mono">HDFCO001234</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-slate-400">Payment Date</span>
                                <span className="font-bold text-slate-800 font-mono">
                                    {selectedPayroll?.paid_at ? new Date(selectedPayroll.paid_at).toLocaleDateString('en-IN') : '30 Apr 2025'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Payment Status</span>
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border px-1.5 py-0.2 rounded uppercase">
                                    {selectedPayroll?.status || 'PAID'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Payment Mode</span>
                                <span className="font-bold text-slate-800 uppercase">NEFT</span>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Deductions Overview */}
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2">Deductions Overview</h3>
                        
                        {selectedPayroll && selectedPayroll.deductions > 0 ? (
                            <div className="space-y-4">
                                <div className="h-32 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={deductionsChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={50}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {deductionsChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
                                        <span className="text-xs font-black text-slate-800">{formatCurrency(selectedPayroll.deductions)}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    {deductionsChartData.map(d => (
                                        <div key={d.name} className="flex items-center justify-between text-[10px]">
                                            <div className="flex items-center space-x-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                <span className="text-slate-500 font-semibold">{d.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{((d.value / selectedPayroll.deductions) * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-xs text-slate-400 py-6">No deductions mapping available.</p>
                        )}
                    </Card>

                    {/* 3. Important Documents */}
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Important Documents</h3>
                            <button className="text-[10px] font-bold text-[#0052FF] hover:underline">View All</button>
                        </div>
                        <div className="space-y-3 text-xs font-bold text-slate-700">
                            {[
                                { name: 'Form 16 (FY 2024-25)' },
                                { name: 'Investment Proof Declaration' },
                                { name: 'Tax Regime Declaration' },
                                { name: 'Salary Revision Letter' }
                            ].map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="flex items-center space-x-2 truncate">
                                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate text-slate-800 font-semibold">{doc.name}</span>
                                    </div>
                                    <button className="text-slate-400 hover:text-[#0052FF] transition-colors shrink-0">
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Row - Payroll Calendar */}
            <Card className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><Calendar className="w-6 h-6" /></div>
                    <div>
                        <h4 className="text-xs font-black text-slate-800">Payroll Calendar</h4>
                        <p className="text-[10px] text-slate-400">View your yearly payroll schedule and upcoming payment dates.</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-center text-xs">
                    <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Next Payroll Date</span>
                        <span className="font-bold text-slate-800 mt-1 block font-mono">{nextPayrollInfo.dateStr}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Total Payrolls (FY 2024-25)</span>
                        <span className="font-bold text-slate-800 mt-1 block font-mono">{myPayrolls.length}/12 Completed</span>
                    </div>
                </div>
                <button className="border hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors self-stretch sm:self-auto justify-center">
                    <span>View Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </Card>
        </div>
    );
}
