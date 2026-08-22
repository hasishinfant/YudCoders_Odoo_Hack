import { useState, useEffect } from 'react';
import { checkIn, checkOut, getTodayAttendance, type AttendanceRecord } from '@/services/attendance';
import { AlertCircle, Clock } from 'lucide-react';

export default function CheckInSystray() {
    const [record, setRecord] = useState<AttendanceRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const loadStatus = async () => {
        try {
            const res = await getTodayAttendance();
            setRecord(res.data || null);
        } catch (err) {
            console.error('Failed to get today attendance', err);
        }
    };

    useEffect(() => {
        loadStatus();
        // Refresh every 1 minute
        const interval = setInterval(loadStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            await checkIn();
            await loadStatus();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to check in');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            await checkOut();
            await loadStatus();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to check out');
        } finally {
            setLoading(false);
            setOpen(false); // Close dropdown on checkout
        }
    };

    // Determine status color
    // Red = Not checked in (ABSENT or no record)
    // Green = Checked in, not checked out yet (PRESENT with no checkout)
    // Gray = Checked out (PRESENT with checkout)
    // Yellow = LEAVE/HALF_DAY
    let statusColor = 'bg-red-500';
    let statusLabel = 'Not Checked In';
    let isCheckedIn = false;
    let isCheckedOut = false;

    if (record) {
        if (record.status === 'PRESENT') {
            if (record.check_in && !record.check_out) {
                statusColor = 'bg-emerald-500';
                statusLabel = 'Checked In';
                isCheckedIn = true;
            } else if (record.check_out) {
                statusColor = 'bg-slate-400';
                statusLabel = 'Checked Out';
                isCheckedOut = true;
            }
        } else if (record.status === 'LEAVE') {
            statusColor = 'bg-purple-500';
            statusLabel = 'On Leave';
        } else if (record.status === 'HALF_DAY') {
            statusColor = 'bg-blue-500';
            statusLabel = 'Half Day';
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 transition-colors"
                title={statusLabel}
            >
                <div className="relative flex items-center justify-center w-5 h-5">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor}`} />
                </div>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 text-xs font-semibold overflow-hidden">
                    <div className="mb-3 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Today's Status</div>
                        <div className="flex items-center justify-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                            <span className="text-sm font-black text-slate-800">{statusLabel}</span>
                        </div>
                        {record?.check_in && (
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                                In: {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {record?.check_out && ` - Out: ${new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100">
                        {statusLabel === 'On Leave' ? (
                            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl flex items-start text-xs border border-purple-100">
                                <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                You are on leave today. Enjoy your time off!
                            </div>
                        ) : !isCheckedIn && !isCheckedOut ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={loading}
                                className="w-full bg-[#0052FF] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <span>Check IN →</span>
                            </button>
                        ) : isCheckedIn && !isCheckedOut ? (
                            <button
                                onClick={handleCheckOut}
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <span>Check OUT →</span>
                            </button>
                        ) : (
                            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl text-center text-[10px] border border-slate-200">
                                You have checked out for the day.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
