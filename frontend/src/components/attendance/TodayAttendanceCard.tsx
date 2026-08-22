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
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const isCheckedIn = !!attendance?.check_in;
    const isCheckedOut = !!attendance?.check_out;

    return (
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        <span>Today's Attendance</span>
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-xs mt-1">
                        {todayDateStr}
                    </CardDescription>
                </div>
                <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        isCheckedOut 
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : isCheckedIn 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                            isCheckedOut ? 'bg-slate-400' : isCheckedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`} />
                        {isCheckedOut ? 'Completed' : isCheckedIn ? 'Present / Working' : 'Not Checked In'}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-xs font-medium border border-red-200">
                        <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Grid of times & hours */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Check In</span>
                        <span className="text-lg font-mono font-bold text-slate-900">{formatTime(attendance?.check_in)}</span>
                    </div>

                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Check Out</span>
                        <span className="text-lg font-mono font-bold text-slate-900">{formatTime(attendance?.check_out)}</span>
                    </div>

                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Worked Hours</span>
                        <span className="text-lg font-mono font-bold text-emerald-700">{formatDuration(attendance?.worked_hours)}</span>
                    </div>

                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Extra Hours</span>
                        <span className="text-lg font-mono font-bold text-blue-600">{formatDuration(attendance?.extra_hours)}</span>
                    </div>
                </div>

                {/* Primary Action Button */}
                <div className="flex justify-end">
                    {!isCheckedIn ? (
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold space-x-2 px-6 h-11" 
                            onClick={handleCheckIn} 
                            disabled={loading}
                        >
                            <LogIn className="w-4 h-4" />
                            <span>{loading ? "Checking In..." : "Check In"}</span>
                        </Button>
                    ) : !isCheckedOut ? (
                        <Button 
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold space-x-2 px-6 h-11" 
                            onClick={handleCheckOut} 
                            disabled={loading}
                        >
                            <LogOutIcon className="w-4 h-4" />
                            <span>{loading ? "Checking Out..." : "Check Out"}</span>
                        </Button>
                    ) : (
                        <Button 
                            variant="outline" 
                            className="text-slate-500 border-slate-300 font-semibold space-x-2 px-6 h-11 cursor-not-allowed" 
                            disabled
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Shift Completed for Today</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
