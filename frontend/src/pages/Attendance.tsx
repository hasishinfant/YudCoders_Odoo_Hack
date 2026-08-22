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
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Building2, Clock } from 'lucide-react';

export default function AttendancePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    // My Attendance State
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [myHistory, setMyHistory] = useState<AttendanceRecord[]>([]);
    const [myLoading, setMyLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Admin All Attendance State
    const [adminRecords, setAdminRecords] = useState<AttendanceRecord[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
    const [filterDate, setFilterDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    const loadMyAttendance = async () => {
        setMyLoading(true);
        try {
            const [todayRes, historyRes] = await Promise.all([
                getTodayAttendance(),
                getMyAttendance({ start_date: startDate || undefined, end_date: endDate || undefined })
            ]);
            setTodayRecord(todayRes.data);
            setMyHistory(historyRes.data || []);
        } catch (err) {
            console.error('Failed to load attendance', err);
        } finally {
            setMyLoading(false);
        }
    };

    const loadAdminAttendance = async () => {
        if (!isAdmin) return;
        setAdminLoading(true);
        try {
            const [attRes, deptRes] = await Promise.all([
                getAdminAttendance({
                    q: searchTerm || undefined,
                    department_id: selectedDept,
                    date: filterDate || undefined,
                    status: selectedStatus || undefined
                }),
                getDepartments()
            ]);
            setAdminRecords(attRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error('Failed to load admin attendance', err);
        } finally {
            setAdminLoading(false);
        }
    };

    useEffect(() => {
        loadMyAttendance();
    }, [startDate, endDate]);

    useEffect(() => {
        if (activeTab === 'all' && isAdmin) {
            const timer = setTimeout(() => {
                loadAdminAttendance();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, searchTerm, selectedDept, filterDate, selectedStatus]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatHours = (val?: number) => {
        if (val === undefined || val === null) return '--';
        const hrs = Math.floor(val);
        const mins = Math.round((val - hrs) * 60);
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Track daily check-ins, worked hours, and attendance records.</p>
                </div>

                {isAdmin && (
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            My Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All Employees Attendance
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'my' ? (
                <div className="space-y-6">
                    {/* Today Card */}
                    <TodayAttendanceCard 
                        attendance={todayRecord} 
                        onUpdate={loadMyAttendance} 
                    />

                    {/* My History Card */}
                    <Card className="bg-white border-slate-200">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900">My Attendance History</CardTitle>
                                <p className="text-xs text-slate-500">View past check-ins and total worked hours.</p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Input 
                                    type="date"
                                    className="w-36 h-9 text-xs"
                                    value={startDate}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                                />
                                <span className="text-slate-400 text-xs">to</span>
                                <Input 
                                    type="date"
                                    className="w-36 h-9 text-xs"
                                    value={endDate}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {myLoading ? (
                                <div className="p-8 text-center text-slate-400">Loading attendance history...</div>
                            ) : myHistory.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No attendance records found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Date</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5">Check In</th>
                                                <th className="p-3.5">Check Out</th>
                                                <th className="p-3.5">Worked Hours</th>
                                                <th className="p-3.5">Extra Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {myHistory.map(rec => (
                                                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-semibold text-slate-900">{rec.date}</td>
                                                    <td className="p-3.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                                            PRESENT
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-mono">{formatTime(rec.check_in)}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(rec.check_out)}</td>
                                                    <td className="p-3.5 font-semibold text-slate-800">{formatHours(rec.worked_hours)}</td>
                                                    <td className="p-3.5 font-semibold text-blue-600">{formatHours(rec.extra_hours)}</td>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input 
                                placeholder="Search employee or code..." 
                                className="pl-9 h-10 text-xs"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedDept || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <Input 
                            type="date"
                            className="h-10 text-xs"
                            value={filterDate}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterDate(e.target.value)}
                        />

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedStatus}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="PRESENT">PRESENT</option>
                            <option value="ABSENT">ABSENT</option>
                            <option value="HALF_DAY">HALF_DAY</option>
                            <option value="LEAVE">LEAVE</option>
                        </select>
                    </div>

                    {/* Admin Table */}
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-0">
                            {adminLoading ? (
                                <div className="p-8 text-center text-slate-400">Loading employee attendance records...</div>
                            ) : adminRecords.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No employee attendance records found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Employee</th>
                                                <th className="p-3.5">Department</th>
                                                <th className="p-3.5">Date</th>
                                                <th className="p-3.5">Check In</th>
                                                <th className="p-3.5">Check Out</th>
                                                <th className="p-3.5">Worked Hours</th>
                                                <th className="p-3.5">Extra Hours</th>
                                                <th className="p-3.5">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {adminRecords.map(rec => (
                                                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-semibold text-slate-900">
                                                        <div>{rec.employee_name || 'N/A'}</div>
                                                        <div className="font-mono text-[10px] text-slate-500 font-normal">{rec.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">{rec.department_name || 'N/A'}</td>
                                                    <td className="p-3.5 font-medium">{rec.date}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(rec.check_in)}</td>
                                                    <td className="p-3.5 font-mono">{formatTime(rec.check_out)}</td>
                                                    <td className="p-3.5 font-semibold text-slate-900">{formatHours(rec.worked_hours)}</td>
                                                    <td className="p-3.5 font-semibold text-blue-600">{formatHours(rec.extra_hours)}</td>
                                                    <td className="p-3.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                                            {rec.status}
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
