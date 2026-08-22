import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getMyAttendance, type AttendanceRecord } from '@/services/attendance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  Umbrella, 
  Lightbulb, 
  Clock, 
  CheckCircle2, 
  X, 
  ArrowRight,
  FileText
} from 'lucide-react';

export default function AttendancePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // View state
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
    
    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthStr = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
    const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await getMyAttendance();
                if (res && res.data) {
                    setAttendanceList(res.data);
                }
            } catch (err) {
                console.error('Failed to load attendance', err);
            }
        };
        loadData();
    }, []);

    const showToast = (text: string) => {
        setToastMessage(text);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Download PDF Report Generator
    const handleDownloadPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast("Failed to open print window. Please allow popups.");
            return;
        }

        const currentMonthDays = calendarDays.filter(day => !day.isPrev && !day.isNext);
        const rowsHtml = currentMonthDays.map(item => {
            const dateStr = `${item.day} ${monthStr} ${year}`;
            const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
            const record = attendanceList.find(r => r.date === dateKey);

            const statusClass = record ? `status-${record.status.toLowerCase()}` : (new Date(year, monthIndex, item.day).getDay() % 6 === 0 ? 'status-leave' : 'status-absent');
            const statusLabel = record ? (record.status === 'PRESENT' ? 'Present' : record.status === 'HALF_DAY' ? 'Half Day' : record.status === 'LEAVE' ? 'Leave' : 'Absent') : (new Date(year, monthIndex, item.day).getDay() % 6 === 0 ? 'Weekly Off' : 'No Record');

            const checkInVal = record?.check_in ? formatTime(record.check_in) : '--:--';
            const checkOutVal = record?.check_out ? formatTime(record.check_out) : '--:--';
            const workingHoursVal = record?.worked_hours ? `${Math.floor(record.worked_hours)}h ${String(Math.round((record.worked_hours % 1) * 60)).padStart(2, '0')}m` : '0h 00m';
            const breakTimeVal = record?.check_in ? '1h 00m' : '0h 00m';
            const overtimeVal = record?.extra_hours ? `${Math.floor(record.extra_hours)}h ${String(Math.round((record.extra_hours % 1) * 60)).padStart(2, '0')}m` : '0h 00m';

            return `
                <tr>
                    <td>${dateStr}</td>
                    <td class="${statusClass}">${statusLabel}</td>
                    <td>${checkInVal}</td>
                    <td>${checkOutVal}</td>
                    <td>${workingHoursVal}</td>
                    <td>${breakTimeVal}</td>
                    <td>${overtimeVal}</td>
                </tr>
            `;
        }).join('');

        const totalWorkedHoursSum = attendanceList.reduce((acc, r) => acc + (r.worked_hours || 0), 0);
        const totalWorkedHrsStr = `${Math.floor(totalWorkedHoursSum)}h ${String(Math.round((totalWorkedHoursSum % 1) * 60)).padStart(2, '0')}m`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dayflow HRMS — Monthly Attendance Report (${selectedMonth})</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
                    .header { text-align: center; margin-bottom: 30px; border-b: 2px solid #0052FF; padding-bottom: 15px; }
                    .header h1 { margin: 0; color: #0052FF; font-size: 24px; }
                    .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
                    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 25px; }
                    .meta-item { font-size: 12px; }
                    .meta-item strong { display: block; color: #0052FF; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                    th { background: #0052FF; color: white; text-align: left; padding: 10px; font-weight: 600; }
                    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background: #f8fafc; }
                    .status-present { color: #16a34a; font-weight: bold; }
                    .status-absent { color: #dc2626; font-weight: bold; }
                    .status-leave { color: #2563eb; font-weight: bold; }
                    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Dayflow HR Management System</h1>
                    <p>Official Monthly Attendance Report — ${selectedMonth}</p>
                </div>

                <div class="meta-grid">
                    <div class="meta-item">Employee Name: <strong>${user?.email?.split('@')[0].toUpperCase() || 'Employee'}</strong></div>
                    <div class="meta-item">Employee ID: <strong>EMP00123</strong></div>
                    <div class="meta-item">Department: <strong>Engineering</strong></div>
                    <div class="meta-item">Days Present: <strong>${presentDays} / ${totalMonthDays} Days</strong></div>
                    <div class="meta-item">Total Worked Hours: <strong>${totalWorkedHrsStr}</strong></div>
                    <div class="meta-item">Average Check-in: <strong>09:00 AM</strong></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check-In</th>
                            <th>Check-Out</th>
                            <th>Working Hours</th>
                            <th>Break Time</th>
                            <th>Overtime</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="footer">
                    Generated automatically by Dayflow HRMS on ${new Date().toLocaleDateString()} • Verified HR Credential Report
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        showToast("Generating official Attendance PDF Report...");
    };

    const [yearStr, monthStr] = selectedMonth.split(' ');
    const year = parseInt(yearStr) || today.getFullYear();
    const monthIndex = monthNames.indexOf(monthStr) !== -1 ? monthNames.indexOf(monthStr) : today.getMonth();

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
    const firstDayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const calendarDays: any[] = [];

    const prevMonthDays = new Date(year, monthIndex, 0).getDate();
    for (let i = firstDayOffset - 1; i >= 0; i--) {
        calendarDays.push({ day: prevMonthDays - i, isPrev: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const record = attendanceList.find(r => r.date === dateString);
        
        let status = '';
        let label = '';
        
        if (record) {
            status = record.status.toLowerCase();
            label = record.status === 'PRESENT' ? 'Present' : record.status === 'HALF_DAY' ? 'Half Day' : record.status === 'LEAVE' ? 'Leave' : 'Absent';
        } else {
            const dayOfWeek = new Date(year, monthIndex, d).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                status = 'holiday';
                label = 'Weekly Off';
            }
        }
        calendarDays.push({ day: d, status, label });
    }

    const totalTiles = Math.ceil(calendarDays.length / 7) * 7;
    const nextPadding = totalTiles - calendarDays.length;
    for (let i = 1; i <= nextPadding; i++) {
        calendarDays.push({ day: i, isNext: true });
    }

    const totalMonthDays = calendarDays.filter(item => !item.isPrev && !item.isNext).length;
    const presentDays = calendarDays.filter(item => item.status === 'present').length;
    const absentDays = calendarDays.filter(item => item.status === 'absent').length;
    const halfDays = calendarDays.filter(item => item.status === 'halfday').length;
    const leaveDays = calendarDays.filter(item => item.status === 'leave').length;
    const holidayDays = calendarDays.filter(item => item.status === 'holiday').length;
    const attendancePercentage = totalMonthDays > 0 ? Math.round(((presentDays + (halfDays * 0.5)) / totalMonthDays) * 100) : 0;

    // Dynamic Selected Day Details
    const selectedDateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    const selectedRecord = attendanceList.find(r => r.date === selectedDateString);

    const getDayName = (y: number, m: number, d: number) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(y, m, d).getDay()];
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const selectedDayDetails = {
        dateStr: `${getDayName(year, monthIndex, selectedDate)}, ${selectedDate} ${monthStr} ${year}`,
        status: selectedRecord ? (selectedRecord.status === 'PRESENT' ? 'Present' : selectedRecord.status === 'HALF_DAY' ? 'Half Day' : selectedRecord.status === 'LEAVE' ? 'Leave' : 'Absent') : (new Date(year, monthIndex, selectedDate).getDay() % 6 === 0 ? 'Weekly Off' : 'No Record'),
        checkIn: selectedRecord?.check_in ? formatTime(selectedRecord.check_in) : '--:--',
        checkOut: selectedRecord?.check_out ? formatTime(selectedRecord.check_out) : '--:--',
        workingHours: selectedRecord?.worked_hours ? `${Math.floor(selectedRecord.worked_hours)}h ${String(Math.round((selectedRecord.worked_hours % 1) * 60)).padStart(2, '0')}m` : '0h 00m',
        breakTime: selectedRecord?.check_in ? '1h 00m' : '0h 00m',
        overtime: selectedRecord?.extra_hours ? `${Math.floor(selectedRecord.extra_hours)}h ${String(Math.round((selectedRecord.extra_hours % 1) * 60)).padStart(2, '0')}m` : '0h 00m',
        source: selectedRecord ? 'Web Check-In' : '-',
        remarks: '-'
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0052FF] text-white font-bold text-xs rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052FF] shadow-xs">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
                        <p className="text-xs text-slate-500 font-medium">Track your attendance, view your leaves and holidays, all in one place.</p>
                    </div>
                </div>
            </div>

            {/* MAIN 3-COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. LEFT COLUMN: Summary & Widgets (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    
                    {/* Attendance Overview Card with Donut Meter */}
                    <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4 relative overflow-hidden">
                        <div className="space-y-1">
                            <h3 className="font-extrabold text-slate-900 text-sm">Hi there! 👋</h3>
                            <p className="text-[11px] text-slate-500 font-medium leading-snug">Here's your attendance overview for this month.</p>
                        </div>

                        {/* Donut Donut Meter */}
                        <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-3">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    strokeWidth="3.8"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-[#0052FF]"
                                    strokeDasharray={`${attendancePercentage}, 100`}
                                    strokeWidth="3.8"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-lg font-black text-slate-900 leading-tight">{presentDays} / {totalMonthDays}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">Days Present</span>
                            </div>
                        </div>

                        {/* Breakdown Legend */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-slate-600">Present</span>
                                </div>
                                <span className="font-extrabold text-slate-900">{presentDays}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-slate-600">Absent</span>
                                </div>
                                <span className="font-extrabold text-slate-900">{absentDays}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-slate-600">Half Day</span>
                                </div>
                                <span className="font-extrabold text-slate-900">{halfDays}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
                                    <span className="text-slate-600">Leave</span>
                                </div>
                                <span className="font-extrabold text-slate-900">{leaveDays}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-slate-600">Weekly Off</span>
                                </div>
                                <span className="font-extrabold text-slate-900">{holidayDays}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Leave Balance Card */}
                    <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <Umbrella className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Leave Balance</span>
                                <h4 className="font-black text-sm text-slate-900 leading-tight">12 Days <span className="text-xs text-slate-400 font-normal">Available</span></h4>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/time-off')} 
                            className="text-[#0052FF] text-xs font-extrabold hover:underline flex items-center space-x-1 pt-1"
                        >
                            <span>Apply for Leave</span>
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </Card>

                    {/* Leave Recommendation Card */}
                    <Card className="bg-amber-50/50 border-amber-200/80 rounded-3xl shadow-sm p-4 space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-xs text-slate-900">Leave Recommendation</h4>
                                <p className="text-[11px] text-slate-600 leading-snug">
                                    If you take <strong>2 more leaves</strong>, you will reach <strong>80%</strong> of your monthly leave limit.
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => setPolicyModalOpen(true)}
                            variant="outline" 
                            className="w-full bg-white text-slate-800 border-amber-200 hover:bg-amber-100/50 font-bold text-xs h-8 rounded-xl"
                        >
                            View Policy →
                        </Button>
                    </Card>

                    {/* Download Attendance Card */}
                    <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <Download className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-xs text-slate-900">Download Attendance</h4>
                                <p className="text-[10px] text-slate-400 font-medium">Get your attendance report for a selected month.</p>
                            </div>
                        </div>

                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                        >
                            <option value="May 2025">May 2025</option>
                            <option value="April 2025">April 2025</option>
                            <option value="March 2025">March 2025</option>
                        </select>

                        <Button 
                            onClick={handleDownloadPDF}
                            className="w-full bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl space-x-2 shadow-md shadow-blue-500/20"
                        >
                            <Download className="w-3.5 h-3.5 text-white" />
                            <span>Download PDF</span>
                        </Button>
                    </Card>
                </div>

                {/* 2. MIDDLE COLUMN: Calendar Grid (6 cols) */}
                <div className="lg:col-span-6 space-y-4">
                    <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
                        {/* Month Nav & View Switchers */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-2">
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                    <CalendarIcon className="w-4 h-4 text-[#0052FF]" />
                                    <span className="font-extrabold text-xs text-slate-900">{selectedMonth}</span>
                                </div>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* View Switchers */}
                            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                                <button 
                                    onClick={() => setViewMode('month')} 
                                    className={`px-3 py-1 rounded-xl transition-all ${
                                        viewMode === 'month' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Month View
                                </button>
                                <button 
                                    onClick={() => setViewMode('week')} 
                                    className={`px-3 py-1 rounded-xl transition-all ${
                                        viewMode === 'week' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Week View
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')} 
                                    className={`px-3 py-1 rounded-xl transition-all ${
                                        viewMode === 'list' ? 'bg-[#0052FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    List View
                                </button>
                            </div>

                            <button className="flex items-center space-x-1 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">
                                <Filter className="w-3.5 h-3.5 text-slate-500" />
                                <span>Filters</span>
                            </button>
                        </div>

                        {/* Calendar 7-Column Header */}
                        <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-100 pb-2">
                            <span>MON</span>
                            <span>TUE</span>
                            <span>WED</span>
                            <span>THU</span>
                            <span>FRI</span>
                            <span>SAT</span>
                            <span>SUN</span>
                        </div>

                        {/* Calendar Grid 35 Tiles */}
                        <div className="grid grid-cols-7 gap-1.5 text-xs">
                            {calendarDays.map((item, idx) => {
                                if (item.isPrev || item.isNext) {
                                    return (
                                        <div key={idx} className="h-16 border border-slate-100 rounded-2xl bg-slate-50/50 p-1.5 text-slate-300 font-bold">
                                            <span>{item.day}</span>
                                        </div>
                                    );
                                }

                                const isSelected = item.day === selectedDate;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDate(item.day)}
                                        className={`h-16 rounded-2xl p-1.5 flex flex-col justify-between cursor-pointer transition-all border ${
                                            isSelected
                                                ? 'bg-[#0052FF] text-white border-[#0052FF] shadow-lg shadow-blue-500/30 scale-102 z-10'
                                                : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-800'
                                        }`}
                                    >
                                        <span className={`font-black text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>{item.day}</span>
                                        
                                        {item.status && (
                                            <div className={`px-1.5 py-0.5 rounded-full text-[9px] font-black text-center truncate flex items-center justify-center space-x-1 ${
                                                isSelected 
                                                    ? 'bg-white text-[#0052FF]' 
                                                    : item.status === 'present' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : item.status === 'absent' 
                                                            ? 'bg-red-100 text-red-800' 
                                                            : item.status === 'halfday' 
                                                                ? 'bg-purple-100 text-purple-800' 
                                                                : item.status === 'leave' 
                                                                    ? 'bg-amber-100 text-amber-800' 
                                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                <span className={`w-1 h-1 rounded-full ${
                                                    isSelected ? 'bg-[#0052FF]' : item.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'
                                                }`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* 3. RIGHT COLUMN: Selected Day Details Inspector (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    
                    {/* Motivational Illustration Banner Card */}
                    <Card className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border-blue-100 rounded-3xl shadow-sm p-4 text-center space-y-2 relative overflow-hidden">
                        <div className="text-[#0052FF] font-black text-xs tracking-tight">Good Work Keeps Going! ☀️</div>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md mx-auto flex items-center justify-center border border-blue-100">
                            <Clock className="w-8 h-8 text-[#0052FF]" />
                        </div>
                    </Card>

                    {/* Selected Day Inspector Panel */}
                    <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-black text-xs text-slate-900">{selectedDayDetails.dateStr}</h3>
                            <button onClick={() => setSelectedDate(10)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Status Pill */}
                        <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full flex items-center space-x-1.5 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{selectedDayDetails.status}</span>
                        </div>

                        {/* Details List */}
                        <div className="space-y-2.5 text-xs font-semibold">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Check-in Time</span>
                                </div>
                                <strong className="text-slate-900 font-extrabold">{selectedDayDetails.checkIn}</strong>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Check-out Time</span>
                                </div>
                                <strong className="text-slate-900 font-extrabold">{selectedDayDetails.checkOut}</strong>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Working Hours</span>
                                </div>
                                <strong className="text-slate-900 font-extrabold">{selectedDayDetails.workingHours}</strong>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Break Time</span>
                                </div>
                                <strong className="text-slate-900 font-extrabold">{selectedDayDetails.breakTime}</strong>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Overtime</span>
                                </div>
                                <strong className="text-slate-900 font-extrabold">{selectedDayDetails.overtime}</strong>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Attendance Source</span>
                                <strong className="text-slate-900 font-bold">{selectedDayDetails.source}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Remarks</span>
                                <strong className="text-slate-900 font-bold">{selectedDayDetails.remarks}</strong>
                            </div>
                        </div>

                        <Button 
                            variant="outline"
                            className="w-full text-[#0052FF] border-blue-200 hover:bg-blue-50 font-bold text-xs h-9 rounded-xl flex items-center justify-center space-x-1"
                        >
                            <span>View Week Activity</span>
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    </Card>

                </div>
            </div>

            {/* 4. BOTTOM SECTION: Week Activity Horizon Bar */}
            <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900">Week Activity: 04 May – 10 May 2025</h3>
                    <div className="flex items-center space-x-2">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                    {[
                        { day: 'SUN 04', status: 'Absent', sub: 'Weekly Off', badge: 'bg-red-100 text-red-800' },
                        { day: 'MON 05', status: 'Present', inTime: '09:04 AM Check-in', outTime: '06:05 PM Check-out', hrs: '9h 03m Working Hrs', badge: 'bg-emerald-100 text-emerald-800' },
                        { day: 'TUE 06', status: 'Present', inTime: '09:04 AM Check-in', outTime: '06:01 PM Check-out', hrs: '8h 57m Working Hrs', badge: 'bg-emerald-100 text-emerald-800' },
                        { day: 'WED 07', status: 'Present', inTime: '09:01 AM Check-in', outTime: '05:58 PM Check-out', hrs: '8h 57m Working Hrs', badge: 'bg-emerald-100 text-emerald-800' },
                        { day: 'THU 08', status: 'Leave', sub: 'Personal Leave', badge: 'bg-amber-100 text-amber-800' },
                        { day: 'FRI 09', status: 'Present', inTime: '09:03 AM Check-in', outTime: '06:04 PM Check-out', hrs: '9h 01m Working Hrs', badge: 'bg-emerald-100 text-emerald-800' },
                        { day: 'SAT 10', status: 'Half Day', inTime: '09:10 AM Check-in', outTime: '01:15 PM Check-out', hrs: '4h 05m Working Hrs', badge: 'bg-purple-100 text-purple-800' }
                    ].map((w, i) => (
                        <div key={i} className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-2 text-center text-xs">
                            <span className="font-black text-slate-800 block text-[11px]">{w.day}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${w.badge}`}>
                                • {w.status}
                            </span>
                            {w.sub ? (
                                <p className="text-[10px] text-slate-400 font-semibold pt-1">{w.sub}</p>
                            ) : (
                                <div className="space-y-0.5 text-[10px] text-slate-600 font-medium pt-1">
                                    <p className="font-bold text-slate-800">{w.inTime}</p>
                                    <p>{w.outTime}</p>
                                    <p className="text-[#0052FF] font-bold">{w.hrs}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Leave Policy Modal */}
            {policyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-[#0052FF]" />
                                <h3 className="font-black text-slate-900 text-sm">Company Leave Policy</h3>
                            </div>
                            <button onClick={() => setPolicyModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                            <p><strong>1. Paid Leave Entitlement:</strong> Every full-time employee is entitled to 20 days of Paid Time Off (PTO) annually.</p>
                            <p><strong>2. Monthly Limit Warning:</strong> Crossing 80% of your monthly leave allotment triggers an automatic HR notification.</p>
                            <p><strong>3. Approval Workflow:</strong> All leave requests must be submitted at least 24 hours in advance via the Leave Portal.</p>
                        </div>
                        <Button className="w-full bg-[#0052FF] text-white font-bold text-xs h-10 rounded-xl" onClick={() => setPolicyModalOpen(false)}>
                            I Understand
                        </Button>
                    </Card>
                </div>
            )}

        </div>
    );
}
