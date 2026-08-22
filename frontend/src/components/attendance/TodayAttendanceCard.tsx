import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkIn, checkOut, type AttendanceRecord } from '@/services/attendance';
import { Clock, LogIn, LogOut as LogOutIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface TodayAttendanceCardProps {
    attendance: AttendanceRecord | null;
    onUpdate: () => void;
}

export default function TodayAttendanceCard({ attendance, onUpdate }: TodayAttendanceCardProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDuration = (hoursDecimal?: number) => {
        if (hoursDecimal === undefined || hoursDecimal === null) return '--';
        const hrs = Math.floor(hoursDecimal);
        const mins = Math.round((hoursDecimal - hrs) * 60);
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    const handleCheckIn = async () => {
        setLoading(true);
        setError('');
        try {
            await checkIn();
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Check-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        setError('');
        try {
            await checkOut();
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Check-out failed');
        } finally {
            setLoading(false);
        }
    };

    const todayDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    const isCheckedIn = !!attendance?.check_in;
    const isCheckedOut = !!attendance?.check_out;

    return (
        <Card className="bg-white border border-sky-100/80 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-sky-400" />
                        <CardTitle className="text-lg font-extrabold text-white tracking-tight">Today's Attendance</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 text-xs mt-1 font-medium">
                        {todayDateStr}
                    </CardDescription>
                </div>
                <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isCheckedOut 
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : isCheckedIn 
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                            isCheckedOut ? 'bg-slate-400' : isCheckedIn ? 'bg-sky-400 animate-ping' : 'bg-amber-400'
                        }`} />
                        {isCheckedOut ? 'Shift Completed' : isCheckedIn ? 'Active / On Duty' : 'Not Checked In'}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center text-xs font-semibold border border-red-200">
                        <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                    <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Check In</span>
                        <span className="text-base font-mono font-bold text-slate-900">{formatTime(attendance?.check_in)}</span>
                    </div>

                    <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Check Out</span>
                        <span className="text-base font-mono font-bold text-slate-900">{formatTime(attendance?.check_out)}</span>
                    </div>

                    <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Worked Hours</span>
                        <span className="text-base font-mono font-extrabold text-sky-600">{formatDuration(attendance?.worked_hours)}</span>
                    </div>

                    <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Extra Hours</span>
                        <span className="text-base font-mono font-extrabold text-indigo-600">{formatDuration(attendance?.extra_hours)}</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    {!isCheckedIn ? (
                        <Button 
                            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold space-x-2 px-6 h-11 rounded-xl shadow-md shadow-sky-500/20 transition-all hover:scale-105" 
                            onClick={handleCheckIn} 
                            disabled={loading}
                        >
                            <LogIn className="w-4 h-4" />
                            <span>{loading ? "Checking In..." : "Check In Now"}</span>
                        </Button>
                    ) : !isCheckedOut ? (
                        <Button 
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold space-x-2 px-6 h-11 rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-105" 
                            onClick={handleCheckOut} 
                            disabled={loading}
                        >
                            <LogOutIcon className="w-4 h-4" />
                            <span>{loading ? "Checking Out..." : "Check Out Shift"}</span>
                        </Button>
                    ) : (
                        <Button 
                            variant="outline" 
                            className="bg-slate-100 text-slate-600 border-slate-200 font-bold space-x-2 px-6 h-11 rounded-xl cursor-not-allowed" 
                            disabled
                        >
                            <CheckCircle2 className="w-4 h-4 text-sky-600" />
                            <span>Today's Shift Logged</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
