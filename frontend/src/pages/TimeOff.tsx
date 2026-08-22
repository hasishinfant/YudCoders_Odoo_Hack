import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getMyLeaveBalances,
    getMyLeaveRequests,
    getAdminLeaveRequests,
    approveLeaveRequest,
    type LeaveBalance,
    type LeaveRequest
} from '@/services/leave';
import { getDepartments, type Department } from '@/services/departments';
import RequestLeaveModal from '@/components/leave/RequestLeaveModal';
import RefuseLeaveModal from '@/components/leave/RefuseLeaveModal';
import LeaveBalanceCard from '@/components/leave/LeaveBalanceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Calendar, 
    Plus, 
    X, 
    Search, 
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';

export default function TimeOffPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    // Modals
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [refuseRequestId, setRefuseRequestId] = useState<number | null>(null);

    // State
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [adminRequests, setAdminRequests] = useState<LeaveRequest[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    const loadMyTimeOff = async () => {
        setLoading(true);
        try {
            const [balRes, reqRes] = await Promise.all([
                getMyLeaveBalances().catch(() => ({ data: [] })),
                getMyLeaveRequests().catch(() => ({ data: [] }))
            ]);
            setLeaveBalances(balRes.data || []);
            setMyRequests(reqRes.data || []);
        } catch (err) {
            console.error('Failed to load leave data', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAdminTimeOff = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const [reqRes, deptRes] = await Promise.all([
                getAdminLeaveRequests({
                    q: searchTerm || undefined,
                    department_id: selectedDept,
                    status: selectedStatus || undefined
                }),
                getDepartments()
            ]);
            setAdminRequests(reqRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error('Failed to load admin leave requests', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyTimeOff();
    }, []);

    useEffect(() => {
        if (activeTab === 'all' && isAdmin) {
            const timer = setTimeout(() => {
                loadAdminTimeOff();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, searchTerm, selectedDept, selectedStatus]);

    const handleApprove = async (id: number) => {
        try {
            await approveLeaveRequest(id);
            loadAdminTimeOff();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to approve leave request');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
            case 'REFUSED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Refused</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700"><X className="w-3 h-3 mr-1" /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Off & Leave Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Submit leave requests, view entitlement balances, and review departmental time-off approvals.</p>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                    {isAdmin && (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    activeTab === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                My Leaves
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                    activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Organization Requests
                            </button>
                        </div>
                    )}

                    <Button 
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 h-10 space-x-1.5 rounded-xl shadow-md shadow-slate-900/10"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Request Time Off</span>
                    </Button>
                </div>
            </div>

            {/* Leave Balance Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {leaveBalances.map(b => (
                    <LeaveBalanceCard key={b.leave_type_id} balance={b} />
                ))}
            </div>

            {activeTab === 'my' ? (
                /* My Leave Requests Table */
                <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>My Leave Request History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading leave requests...</div>
                        ) : myRequests.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 space-y-2">
                                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-semibold text-sm">No leave requests submitted yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                            <th className="p-3.5 pl-6">Leave Type</th>
                                            <th className="p-3.5">Start Date</th>
                                            <th className="p-3.5">End Date</th>
                                            <th className="p-3.5">Days</th>
                                            <th className="p-3.5">Reason</th>
                                            <th className="p-3.5 text-right pr-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {myRequests.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3.5 pl-6 font-bold text-slate-900">{r.leave_type_name}</td>
                                                <td className="p-3.5 font-mono">{r.start_date}</td>
                                                <td className="p-3.5 font-mono">{r.end_date}</td>
                                                <td className="p-3.5 font-mono font-bold text-slate-800">{r.duration_days} days</td>
                                                <td className="p-3.5 text-slate-600 max-w-xs truncate">{r.reason || '--'}</td>
                                                <td className="p-3.5 text-right pr-6">{getStatusBadge(r.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
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

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                            value={selectedStatus}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REFUSED">REFUSED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>

                    <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading leave requests...</div>
                            ) : adminRequests.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No leave requests found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Employee</th>
                                                <th className="p-3.5">Department</th>
                                                <th className="p-3.5">Leave Type</th>
                                                <th className="p-3.5">Period</th>
                                                <th className="p-3.5">Days</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {adminRequests.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                        <div>{r.employee_name || 'N/A'}</div>
                                                        <div className="font-mono text-[10px] text-slate-500 font-normal">{r.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">{r.department_name || 'N/A'}</td>
                                                    <td className="p-3.5 font-bold text-slate-800">{r.leave_type_name}</td>
                                                    <td className="p-3.5 font-mono">{r.start_date} to {r.end_date}</td>
                                                    <td className="p-3.5 font-mono font-bold text-slate-900">{r.duration_days} days</td>
                                                    <td className="p-3.5">{getStatusBadge(r.status)}</td>
                                                    <td className="p-3.5 text-right pr-6 space-x-2">
                                                        {r.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(r.id)}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition-colors"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRefuseRequestId(r.id)}
                                                                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-[11px] px-3 py-1 rounded-lg transition-colors"
                                                                >
                                                                    Refuse
                                                                </button>
                                                            </>
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
            )}

            {/* Modals */}
            <RequestLeaveModal 
                leaveTypes={leaveBalances.map(b => ({ 
                    id: b.leave_type_id, 
                    name: b.leave_type_name, 
                    paid: true, 
                    max_days: b.max_days, 
                    active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }))}
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={loadMyTimeOff}
            />

            <RefuseLeaveModal 
                requestId={refuseRequestId}
                isOpen={!!refuseRequestId}
                onClose={() => setRefuseRequestId(null)}
                onSuccess={loadAdminTimeOff}
            />
        </div>
    );
}
