import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generatePayroll } from '@/services/payroll';
import { AlertCircle, X, DollarSign } from 'lucide-react';

interface GeneratePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GeneratePayrollModal({ isOpen, onClose, onSuccess }: GeneratePayrollModalProps) {
    const today = new Date();
    const [month, setMonth] = useState<number>(today.getMonth() + 1);
    const [year, setYear] = useState<number>(today.getFullYear());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const monthOptions = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await generatePayroll({ month, year });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate payroll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span>Generate Monthly Payroll</span>
                    </CardTitle>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-xs font-medium border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Select Month
                            </label>
                            <select
                                className="w-full h-10 px-3 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                                value={month}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setMonth(Number(e.target.value))}
                            >
                                {monthOptions.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Select Year
                            </label>
                            <select
                                className="w-full h-10 px-3 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                                value={year}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setYear(Number(e.target.value))}
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose} 
                                className="text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5"
                                disabled={loading}
                            >
                                {loading ? 'Generating...' : 'Generate Payroll'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
