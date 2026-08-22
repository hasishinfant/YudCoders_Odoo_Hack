import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { setEmployeeSalary, getEmployeeSalary } from '@/services/payroll';
import { AlertCircle, X, DollarSign } from 'lucide-react';

interface EditSalaryModalProps {
    employeeId: number | null;
    employeeName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditSalaryModal({ employeeId, employeeName, isOpen, onClose, onSuccess }: EditSalaryModalProps) {
    const [basicSalary, setBasicSalary] = useState('');
    const [allowances, setAllowances] = useState('');
    const [deductions, setDeductions] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && employeeId) {
            setLoading(true);
            getEmployeeSalary(employeeId)
                .then(res => {
                    if (res.data) {
                        setBasicSalary(String(res.data.basic_salary));
                        setAllowances(String(res.data.allowances));
                        setDeductions(String(res.data.deductions));
                        setEffectiveFrom(res.data.effective_from);
                    }
                })
                .catch(() => {
                    setBasicSalary('50000');
                    setAllowances('5000');
                    setDeductions('2000');
                    setEffectiveFrom(new Date().toISOString().split('T')[0]);
                })
                .finally(() => setLoading(false));
        } else {
            setBasicSalary('');
            setAllowances('');
            setDeductions('');
            setEffectiveFrom('');
        }
        setError('');
    }, [isOpen, employeeId]);

    const numBasic = Number(basicSalary) || 0;
    const numAllowances = Number(allowances) || 0;
    const numDeductions = Number(deductions) || 0;
    const grossSalary = numBasic + numAllowances;
    const netSalary = Math.max(0, grossSalary - numDeductions);

    if (!isOpen || !employeeId) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await setEmployeeSalary({
                employee_id: employeeId,
                basic_salary: numBasic,
                allowances: numAllowances,
                deductions: numDeductions,
                effective_from: effectiveFrom
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save salary config');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg bg-white border-slate-200 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200">
                <div className="bg-[#0052FF] text-white p-5 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-blue-100" />
                        <span>Salary Configuration — {employeeName || 'Employee'}</span>
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-blue-100 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                </div>

                <CardContent className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-xs font-medium border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Basic Salary (₹)
                                </label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    className="h-10 text-xs font-mono font-bold"
                                    value={basicSalary}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBasicSalary(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Allowances (₹)
                                </label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    className="h-10 text-xs font-mono font-bold text-emerald-600"
                                    value={allowances}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAllowances(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Deductions (₹)
                                </label>
                                <Input 
                                    type="number"
                                    step="0.01"
                                    className="h-10 text-xs font-mono font-bold text-red-600"
                                    value={deductions}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDeductions(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Effective Date
                                </label>
                                <Input 
                                    type="date"
                                    className="h-10 text-xs font-medium"
                                    value={effectiveFrom}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEffectiveFrom(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Calculations Preview */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-slate-500 block text-[10px]">Gross Salary</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">₹{grossSalary.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-[10px]">Net Take-Home Pay</span>
                                <span className="font-mono font-bold text-emerald-600 text-sm">₹{netSalary.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose} 
                                className="text-xs font-semibold rounded-xl h-10 px-4"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-xl h-10 shadow-md shadow-blue-500/10 transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
