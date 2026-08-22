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
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
                    className={`h-6 w-6 text-[10px] flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors
                        ${hasLeave ? 'bg-red-500 text-white font-bold' : hasPending ? 'bg-amber-500 text-white font-bold' : 'text-slate-300'}`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div key={month} className="p-4 border border-slate-700 rounded-xl bg-slate-900 shadow-sm">
                <div className="text-center font-bold text-slate-200 text-xs mb-3">{monthName} {year}</div>
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-500 mb-2">
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
            <div className="flex items-center space-x-1 border-b border-slate-700 bg-slate-900 px-4 pt-4 rounded-t-xl overflow-hidden">
                <button className="px-6 py-2.5 text-xs font-bold rounded-t-lg transition-colors bg-slate-700 text-white">
                    Time Off
                </button>
            </div>

            <div className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-700 p-6 shadow-xl text-slate-200">
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => { setSelectedDate(new Date()); setIsRequestModalOpen(true); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded text-xs transition-colors shadow-lg shadow-purple-500/20"
                    >
                        NEW
                    </button>
                    <div className="flex items-center space-x-4 bg-slate-800 rounded-full px-4 py-1.5 border border-slate-700">
                        <button onClick={() => setCurrentYear(y => y - 1)} className="p-1 hover:text-white text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="font-bold text-sm text-white min-w-[60px] text-center">{currentYear}</span>
                        <button onClick={() => setCurrentYear(y => y + 1)} className="p-1 hover:text-white text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Balances Summary */}
                <div className="grid grid-cols-2 gap-4 mb-8 border-b border-slate-700 pb-6 text-center">
                    <div>
                        <div className="text-blue-400 font-bold text-sm mb-1">Paid time Off</div>
                        <div className="text-xs text-slate-400">
                            {loadingMy ? '...' : (balances.find(b => b.leave_type_name.toLowerCase().includes('paid'))?.remaining_days || 0)} Days Available
                        </div>
                    </div>
                    <div>
                        <div className="text-blue-400 font-bold text-sm mb-1">Sick time off</div>
                        <div className="text-xs text-slate-400">
                            {loadingMy ? '...' : (balances.find(b => b.leave_type_name.toLowerCase().includes('sick'))?.remaining_days || 0)} Days Available
                        </div>
                    </div>
                </div>

                {/* Full Year Calendar Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => renderMonth(currentYear, i))}
                </div>
            </div>

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
