import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createLeaveRequest, type LeaveType } from '@/services/leave';
import { Calendar, AlertCircle, X, Clock } from 'lucide-react';

interface RequestLeaveModalProps {
    leaveTypes: LeaveType[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultStartDate?: string;
}

export default function RequestLeaveModal({ leaveTypes, isOpen, onClose, onSuccess, defaultStartDate }: RequestLeaveModalProps) {
    const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const durationDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    }, [startDate, endDate]);

    useEffect(() => {
        if (isOpen) {
            setStartDate(defaultStartDate || '');
            setEndDate(defaultStartDate || '');
            setReason('');
            setError('');
            if (leaveTypes.length > 0) {
                setLeaveTypeId(leaveTypes[0].id);
            }
        }
    }, [isOpen, defaultStartDate, leaveTypes]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!leaveTypeId) {
            setError('Please select a leave type');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select start and end dates');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after end date');
            return;
        }

        setLoading(true);
        try {
            await createLeaveRequest({
                leave_type_id: Number(leaveTypeId),
                start_date: startDate,
                end_date: endDate,
                reason: reason || undefined
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit leave request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg bg-white border-slate-200 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200">
                <div className="bg-[#0052FF] text-white p-5 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-100" />
                        <span>Request Time Off</span>
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-blue-100 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <CardContent className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-xs font-medium border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Leave Type
                            </label>
                            <select
                                className="w-full h-10 px-3 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                                value={leaveTypeId}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setLeaveTypeId(Number(e.target.value))}
                            >
                                {leaveTypes.map(lt => (
                                    <option key={lt.id} value={lt.id}>
                                        {lt.name} ({lt.paid ? 'Paid' : 'Unpaid'}) - {lt.max_days} days max
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Start Date
                                </label>
                                <Input 
                                    type="date" 
                                    className="h-10 text-xs"
                                    value={startDate}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    End Date
                                </label>
                                <Input 
                                    type="date" 
                                    className="h-10 text-xs"
                                    value={endDate}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Calculated Duration Display */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500 flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-slate-400" /> Total Duration:
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                                {durationDays} {durationDays === 1 ? 'day' : 'days'}
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Reason for Time Off
                            </label>
                            <textarea
                                className="w-full p-3 text-xs border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-sans"
                                rows={3}
                                placeholder="Explain reason for leave..."
                                value={reason}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                            />
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
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
