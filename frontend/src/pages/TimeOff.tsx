import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getLeaveTypes,
    getMyLeaveRequests,
    getMyLeaveBalances,
    type LeaveType,
    type LeaveBalance,
    type LeaveRequest
} from '@/services/leave';
import RequestLeaveModal from '@/components/leave/RequestLeaveModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TimeOffPage() {
    useAuth();

    // Modals
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // My Time Off State
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [loadingMy, setLoadingMy] = useState(true);

    const loadMyTimeOff = async () => {
        setLoadingMy(true);
        try {
            const [ltRes, balRes, myReqRes] = await Promise.all([
                getLeaveTypes(),
                getMyLeaveBalances(),
                getMyLeaveRequests()
            ]);
            setLeaveTypes(ltRes.data || []);
            setBalances(balRes.data || []);
            setMyRequests(myReqRes.data || []);
        } catch (err) {
            console.error('Failed to load my time off data', err);
        } finally {
            setLoadingMy(false);
        }
    };

    useEffect(() => {
        loadMyTimeOff();
    }, []);

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsRequestModalOpen(true);
    };

    const renderMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = date.getDay();
        
        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-6 w-6"></div>);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDateStr = new Date(year, month, i).toISOString().split('T')[0];
            const hasLeave = myRequests.some(r => r.start_date <= currentDateStr && r.end_date >= currentDateStr && r.status === 'APPROVED');
            const hasPending = myRequests.some(r => r.start_date <= currentDateStr && r.end_date >= currentDateStr && r.status === 'PENDING');
            
            days.push(
                <button 
                    key={`day-${i}`} 
                    onClick={() => handleDayClick(new Date(year, month, i))}
                    className={`h-6 w-6 text-[10px] flex items-center justify-center rounded-full transition-colors font-semibold
                        ${hasLeave 
                            ? 'bg-red-100 text-red-600 border border-red-200 font-bold' 
                            : hasPending 
                            ? 'bg-amber-100 text-amber-600 border border-amber-200 font-bold' 
                            : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div key={month} className="p-4 border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
                <div className="text-center font-bold text-slate-800 text-xs mb-3 font-mono">{monthName} {year}</div>
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 mb-2">
                    <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-1 justify-items-center">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-[#0052FF]" />
                        Time Off
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Manage your personal leave requests and view annual balances.</p>
                </div>
            </div>

            <Card className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm text-slate-700">
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => { setSelectedDate(new Date()); setIsRequestModalOpen(true); }}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-blue-500/10"
                    >
                        Request Time Off
                    </button>
                    <div className="flex items-center space-x-4 bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200">
                        <button onClick={() => setCurrentYear(y => y - 1)} className="p-1 hover:text-slate-900 text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="font-bold text-xs text-slate-800 min-w-[50px] text-center font-mono">{currentYear}</span>
                        <button onClick={() => setCurrentYear(y => y + 1)} className="p-1 hover:text-slate-900 text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Balances Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 border-b border-slate-100 pb-6">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
                        <div className="text-[#0052FF] font-bold text-xs uppercase tracking-wider mb-1">Paid time Off</div>
                        <div className="text-lg font-black text-slate-800">
                            {loadingMy ? '...' : (balances.find(b => b.leave_type_name.toLowerCase().includes('paid'))?.remaining_days || 0)} Days Available
                        </div>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-center">
                        <div className="text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">Sick time off</div>
                        <div className="text-lg font-black text-slate-800">
                            {loadingMy ? '...' : (balances.find(b => b.leave_type_name.toLowerCase().includes('sick'))?.remaining_days || 0)} Days Available
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end space-x-4 mb-6 text-[10px] font-bold text-slate-400">
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200" />
                        <span>Approved Leave</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-200" />
                        <span>Pending Leave</span>
                    </div>
                </div>

                {/* Full Year Calendar Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => renderMonth(currentYear, i))}
                </div>
            </Card>

            {/* Request Modal */}
            <RequestLeaveModal 
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                leaveTypes={leaveTypes}
                onSuccess={loadMyTimeOff}
                defaultStartDate={selectedDate ? selectedDate.toISOString().split('T')[0] : undefined}
            />
        </div>
    );
}
