import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getLeaveTypes,
    getMyLeaveRequests,
    getMyLeaveBalances,
    cancelLeaveRequest,
    type LeaveType,
    type LeaveBalance,
    type LeaveRequest
} from '@/services/leave';
import LeaveBalanceCard from '@/components/leave/LeaveBalanceCard';
import RequestLeaveModal from '@/components/leave/RequestLeaveModal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Plus, 
    FileText
} from 'lucide-react';

export default function TimeOffPage() {
    useAuth();

    // Modals
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

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

    const handleCancelRequest = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            await cancelLeaveRequest(id);
            loadMyTimeOff();
        } catch (err) {
            console.error('Failed to cancel request', err);
        }
    };

    const getStatusBadge = (status: string) => {
        const base = 'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border';
        switch (status) {
            case 'APPROVED':
                return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-700`}>Approved</span>;
            case 'REFUSED':
                return <span className={`${base} bg-red-50 border-red-200 text-red-700`}>Refused</span>;
            case 'CANCELLED':
                return <span className={`${base} bg-slate-50 border-slate-200 text-slate-500`}>Cancelled</span>;
            default:
                return <span className={`${base} bg-amber-50 border-amber-200 text-amber-700`}>Pending</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Time Off &amp; Leave Management</h1>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#0052FF]">
                            EMPLOYEE CENTER
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Submit leave requests, view entitlement balances, and manage time off.</p>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
                    <Button 
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-black text-xs px-4 h-10 space-x-1.5 rounded-xl shadow-md shadow-blue-500/10"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Request Time Off</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Leave Balances Grid */}
                <div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Available Leave Balances</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {balances.map(b => (
                            <LeaveBalanceCard key={b.leave_type_id} balance={b} />
                        ))}
                    </div>
                </div>

                {/* My Requests Table */}
                <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-black text-slate-900">My Leave Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingMy ? (
                            <div className="p-8 text-center text-slate-400">Loading leave requests...</div>
                        ) : myRequests.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 space-y-2">
                                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-semibold text-sm">No leave requests submitted yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                            <th className="p-3.5 pl-6">Leave Type</th>
                                            <th className="p-3.5">Dates</th>
                                            <th className="p-3.5">Duration</th>
                                            <th className="p-3.5">Reason</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5">HR Comment</th>
                                            <th className="p-3.5 text-right pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {myRequests.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                    {req.leave_type_name}
                                                    <span className="block text-[10px] font-normal text-slate-400">
                                                        {req.leave_type_paid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 font-medium">
                                                    {req.start_date} <span className="text-slate-400">to</span> {req.end_date}
                                                </td>
                                                <td className="p-3.5 font-mono font-bold text-slate-900">
                                                    {req.duration_days} {req.duration_days === 1 ? 'day' : 'days'}
                                                </td>
                                                <td className="p-3.5 max-w-xs truncate text-slate-600">
                                                    {req.reason || '--'}
                                                </td>
                                                <td className="p-3.5">
                                                    {getStatusBadge(req.status)}
                                                </td>
                                                <td className="p-3.5 max-w-xs truncate text-slate-600 italic">
                                                    {req.comment || '--'}
                                                </td>
                                                <td className="p-3.5 text-right pr-6">
                                                    {req.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleCancelRequest(req.id)}
                                                            className="text-red-600 hover:text-red-800 font-bold text-xs transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
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

            {/* Modals */}
            <RequestLeaveModal 
                leaveTypes={leaveTypes}
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={loadMyTimeOff}
            />
        </div>
    );
}
