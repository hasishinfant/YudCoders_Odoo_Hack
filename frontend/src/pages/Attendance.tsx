import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getTodayAttendance,
    getMyAttendance,
    getAdminAttendance,
    type AttendanceRecord
} from '@/services/attendance';
import { getDepartments, type Department } from '@/services/departments';
import TodayAttendanceCard from '@/components/attendance/TodayAttendanceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
    Clock, 
    Calendar, 
    Search
} from 'lucide-react';

export default function AttendancePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    // Attendance State
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
    const [adminRecords, setAdminRecords] = useState<AttendanceRecord[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin Filters
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const loadMyAttendance = async () => {
        setLoading(true);
        try {
            const [todayRes, historyRes] = await Promise.all([
                getTodayAttendance().catch(() => ({ data: null })),
                getMyAttendance().catch(() => ({ data: [] }))
            ]);
            setTodayAttendance(todayRes?.data || null);
            setHistoryRecords(historyRes?.data || []);
        } catch (err) {
            console.error('Failed to load my attendance data', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAdminAttendance = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const [attRes, deptRes] = await Promise.all([
                getAdminAttendance({
                    date: selectedDate || undefined,
                    department_id: selectedDept,
                    q: searchTerm || undefined
                }),
                getDepartments()
            ]);
            setAdminRecords(attRes?.data || []);
            setDepartments(deptRes?.data || []);
        } catch (err) {
            console.error('Failed to load admin attendance records', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyAttendance();
    }, []);

    useEffect(() => {
        if (activeTab === 'all' && isAdmin) {
            const timer = setTimeout(() => {
                loadAdminAttendance();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, selectedDate, selectedDept, searchTerm]);

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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Track shift check-ins, worked hours calculations, overtime, and organizational daily logs.</p>
                </div>

                {isAdmin && (
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                activeTab === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            My Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Organization Logs
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'my' ? (
                <div className="space-y-6">
                    {/* Today Attendance Hero Component */}
                    <TodayAttendanceCard 
                        attendance={todayAttendance} 
                        onUpdate={loadMyAttendance} 
                    />

                    {/* Attendance History Table */}
                    <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                <span>Recent Shift Logs</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading attendance history...</div>
                            ) : historyRecords.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No historical attendance records</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Date</th>
                                                <th className="p-3.5">Check In</th>
                                                <th className="p-3.5">Check Out</th>
                                                <th className="p-3.5">Worked Hours</th>
                                                <th className="p-3.5">Extra Hours</th>
                                                <th className="p-3.5 text-right pr-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {historyRecords.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-bold text-slate-900">{r.date}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(r.check_in)}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(r.check_out)}</td>
                                                    <td className="p-3.5 font-mono font-bold text-emerald-700">{formatDuration(r.worked_hours)}</td>
                                                    <td className="p-3.5 font-mono font-bold text-indigo-600">{formatDuration(r.extra_hours)}</td>
                                                    <td className="p-3.5 text-right pr-6">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                            r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                                                            r.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* Admin View */
                <div className="space-y-4">
                    {/* Admin Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input 
                                placeholder="Search employee..." 
                                className="pl-9 h-10 text-xs rounded-xl"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Input 
                            type="date"
                            className="h-10 text-xs rounded-xl"
                            value={selectedDate}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                        />

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                            value={selectedDept || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading attendance records...</div>
                            ) : adminRecords.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No attendance records for date {selectedDate}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Employee</th>
                                                <th className="p-3.5">Department</th>
                                                <th className="p-3.5">Check In</th>
                                                <th className="p-3.5">Check Out</th>
                                                <th className="p-3.5">Worked Hours</th>
                                                <th className="p-3.5">Extra Hours</th>
                                                <th className="p-3.5 text-right pr-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {adminRecords.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                        <div>{r.employee_name || 'N/A'}</div>
                                                        <div className="font-mono text-[10px] text-slate-500 font-normal">{r.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">{r.department_name || 'N/A'}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(r.check_in)}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(r.check_out)}</td>
                                                    <td className="p-3.5 font-mono font-bold text-emerald-700">{formatDuration(r.worked_hours)}</td>
                                                    <td className="p-3.5 font-mono font-bold text-indigo-600">{formatDuration(r.extra_hours)}</td>
                                                    <td className="p-3.5 text-right pr-6">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                            r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                                                            r.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
