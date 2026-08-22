import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { refuseLeaveRequest } from '@/services/leave';
import { AlertCircle, X, XCircle } from 'lucide-react';

interface RefuseLeaveModalProps {
    requestId: number | null;
    employeeName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RefuseLeaveModal({ requestId, employeeName, isOpen, onClose, onSuccess }: RefuseLeaveModalProps) {
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !requestId) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await refuseLeaveRequest(requestId, comment);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to refuse leave request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200">
                <div className="bg-red-600 text-white p-5 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-red-100" />
                        <span>Refuse Leave Request</span>
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-red-100 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                </div>

                <CardContent className="p-6 space-y-4">
                    <p className="text-xs text-slate-600 font-medium">
                        Refusing leave request for <strong className="text-slate-900">{employeeName || 'Employee'}</strong>. Please provide an explicit reason.
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-xs font-medium border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Refusal Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full p-3 text-xs border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                                rows={3}
                                placeholder="Explain why this request is being refused..."
                                value={comment}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                required
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
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 rounded-xl h-10 shadow-md shadow-red-500/10 transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Refusing...' : 'Confirm Refusal'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
