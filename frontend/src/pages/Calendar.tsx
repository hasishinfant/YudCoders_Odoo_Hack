import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { getMyLeaveRequests, type LeaveRequest } from '@/services/leave';
import { getMyAttendance, type AttendanceRecord } from '@/services/attendance';

interface CalendarEvent {
    date: string;
    title: string;
    type: 'Leave' | 'Present' | 'Absent' | 'Half-Day';
    color: string;
    bg: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    'APPROVED': { color: 'text-purple-700', bg: 'bg-purple-100' },
    'PENDING': { color: 'text-amber-700', bg: 'bg-amber-100' },
};
const ATTENDANCE_COLORS: Record<string, { color: string; bg: string }> = {
    'PRESENT': { color: 'text-emerald-700', bg: 'bg-emerald-100' },
    'ABSENT': { color: 'text-red-700', bg: 'bg-red-100' },
    'HALF_DAY': { color: 'text-blue-700', bg: 'bg-blue-100' },
    'LEAVE': { color: 'text-purple-700', bg: 'bg-purple-100' },
};

function getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    const last = new Date(end);
    while (current <= last) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

export default function CalendarPage() {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
            const startDate = `${monthStr}-01`;
            const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
            const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

            const [leaveRes, attendRes] = await Promise.all([
                getMyLeaveRequests({ limit: 100 }),
                getMyAttendance({ start_date: startDate, end_date: endDate, limit: 100 })
            ]);

            const leaves: LeaveRequest[] = leaveRes.data || [];
            const attendance: AttendanceRecord[] = attendRes.data || [];

            setLeaveRequests(leaves);
            setAttendanceRecords(attendance);

            const builtEvents: CalendarEvent[] = [];

            // Add attendance records
            for (const rec of attendance) {
                if (rec.date >= startDate && rec.date <= endDate) {
                    const cfg = ATTENDANCE_COLORS[rec.status] || ATTENDANCE_COLORS['PRESENT'];
                    const label =
                        rec.status === 'PRESENT' ? `Present${rec.worked_hours ? ` (${Number(rec.worked_hours).toFixed(1)}h)` : ''}` :
                        rec.status === 'ABSENT' ? 'Absent' :
                        rec.status === 'HALF_DAY' ? 'Half Day' :
                        'On Leave';
                    builtEvents.push({
                        date: rec.date,
                        title: label,
                        type: rec.status === 'PRESENT' ? 'Present' : rec.status === 'ABSENT' ? 'Absent' : rec.status === 'HALF_DAY' ? 'Half-Day' : 'Leave',
                        ...cfg
                    });
                }
            }

            // Add leave requests (APPROVED + PENDING) that overlap with this month
            for (const leave of leaves) {
                const status = leave.status;
                if (status !== 'APPROVED' && status !== 'PENDING') continue;
                const cfg = STATUS_COLORS[status];
                const allDates = getDatesInRange(leave.start_date, leave.end_date);
                for (const d of allDates) {
                    if (d >= startDate && d <= endDate) {
                        // Only add if no attendance record already for that day
                        const alreadyHas = builtEvents.some(e => e.date === d && (e.type === 'Present' || e.type === 'Absent' || e.type === 'Leave' || e.type === 'Half-Day'));
                        if (!alreadyHas) {
                            builtEvents.push({
                                date: d,
                                title: `${leave.leave_type_name || 'Leave'} (${status})`,
                                type: 'Leave',
                                ...cfg
                            });
                        }
                    }
                }
            }

            setEvents(builtEvents);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load calendar data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [viewYear, viewMonth]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const offset = (firstDay + 6) % 7; // Mon = 0

    const cells: (number | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);

    const handlePrevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };
    const handleNextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const getEventsForDate = (day: number) => {
        const formattedDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === formattedDate);
    };

    const isToday = (day: number) => {
        return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
    };

    const upcomingLeaves = leaveRequests.filter(l => (l.status === 'APPROVED' || l.status === 'PENDING') && l.end_date >= today.toISOString().split('T')[0]);
    const presentDays = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'ABSENT').length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-5 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Calendar</h1>
                    <p className="text-xs text-slate-500 mt-1">View your attendance records and approved leave days for each month.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={loadData} disabled={loading} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all shadow-sm disabled:opacity-50" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handlePrevMonth} className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all shadow-sm">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-slate-800 bg-white px-4 h-9 rounded-xl border border-slate-200 flex items-center shadow-sm whitespace-nowrap">
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button onClick={handleNextMonth} className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all shadow-sm">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Present Days', value: presentDays, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: 'Absent Days', value: absentDays, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' },
                    { label: 'Leave Days', value: attendanceRecords.filter(r => r.status === 'LEAVE' || r.status === 'HALF_DAY').length, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100' },
                ].map(s => (
                    <Card key={s.label} className={`${s.bg} border ${s.border} rounded-2xl shadow-sm`}>
                        <CardContent className="p-4 text-center">
                            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-8">
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <div key={day} className="text-center py-3 text-[10px] font-black text-slate-400 tracking-wider">{day}</div>
                            ))}
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-semibold gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Loading calendar...
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-px bg-slate-100">
                                {cells.map((day, idx) => {
                                    if (day === null) return <div key={`e-${idx}`} className="bg-white h-24 p-2 opacity-30" />;
                                    const dateEvents = getEventsForDate(day);
                                    const todayHighlight = isToday(day);
                                    return (
                                        <div key={`d-${day}`} className={`bg-white h-28 p-2 flex flex-col justify-between hover:bg-slate-50/60 transition-colors ${todayHighlight ? 'ring-2 ring-inset ring-[#0052FF]' : ''}`}>
                                            <span className={`text-xs font-black font-mono ${todayHighlight ? 'text-[#0052FF]' : 'text-slate-800'}`}>
                                                {day}
                                                {todayHighlight && <span className="ml-1 text-[8px] bg-[#0052FF] text-white rounded px-1">TODAY</span>}
                                            </span>
                                            <div className="space-y-0.5 overflow-y-auto max-h-16 mt-1">
                                                {dateEvents.map((e, eIdx) => (
                                                    <div
                                                        key={eIdx}
                                                        className={`text-[8px] font-bold leading-tight px-1.5 py-0.5 rounded-md truncate ${e.bg} ${e.color}`}
                                                        title={e.title}
                                                    >
                                                        {e.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Legend */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black text-slate-900">Legend</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                            {[
                                { label: 'Present', color: 'bg-emerald-100 text-emerald-700' },
                                { label: 'Absent', color: 'bg-red-100 text-red-700' },
                                { label: 'Half Day', color: 'bg-blue-100 text-blue-700' },
                                { label: 'Leave (Approved)', color: 'bg-purple-100 text-purple-700' },
                                { label: 'Leave (Pending)', color: 'bg-amber-100 text-amber-700' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center ${l.color}`}>●</span>
                                    <span className="text-xs text-slate-600">{l.label}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Upcoming Leaves */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                <CalendarIcon className="w-5 h-5 text-[#0052FF]" />
                                <span>Upcoming Leave</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-3">
                            {upcomingLeaves.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No upcoming leave scheduled.</p>
                            ) : (
                                upcomingLeaves.slice(0, 5).map((l) => (
                                    <div key={l.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs uppercase ${
                                            l.status === 'APPROVED' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                            L
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[9px] text-slate-400 font-bold block">
                                                {l.start_date} → {l.end_date}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">
                                                {l.leave_type_name || 'Leave'} ({l.duration_days}d)
                                            </h4>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                                l.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {l.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
