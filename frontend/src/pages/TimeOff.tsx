import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getLeaveTypes,
    getMyLeaveRequests,
    getMyLeaveBalances,
    getAdminLeaveRequests,
    cancelLeaveRequest,
    approveLeaveRequest,
    type LeaveType,
    type LeaveBalance,
    type LeaveRequest
} from '@/services/leave';
import { getDepartments, type Department } from '@/services/departments';
import LeaveBalanceCard from '@/components/leave/LeaveBalanceCard';
import RequestLeaveModal from '@/components/leave/RequestLeaveModal';
import RefuseLeaveModal from '@/components/leave/RefuseLeaveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Plus, 
    Search, 
    Check, 
    X, 
    Clock, 
    Building2,
    FileText,
    Ban,
    Calendar,
    Users
} from 'lucide-react';

export default function TimeOffPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    // Modals
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [refuseTargetId, setRefuseTargetId] = useState<number | null>(null);
    const [refuseEmpName, setRefuseEmpName] = useState('');

    // My Time Off State
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [loadingMy, setLoadingMy] = useState(true);

    // Admin State
    const [adminRequests, setAdminRequests] = useState<LeaveRequest[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);
    const [selectedLeaveType, setSelectedLeaveType] = useState<number | undefined>(undefined);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

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

    const loadAdminTimeOff = async () => {
        if (!isAdmin) return;
        setAdminLoading(true);
        try {
            const [reqRes, deptRes, ltRes] = await Promise.all([
                getAdminLeaveRequests({
                    q: searchTerm || undefined,
                    department_id: selectedDept,
                    leave_type_id: selectedLeaveType,
                    status: selectedStatus || undefined
                }),
                getDepartments(),
                getLeaveTypes()
            ]);
            setAdminRequests(reqRes.data || []);
            setDepartments(deptRes.data || []);
            setLeaveTypes(ltRes.data || []);
        } catch (err) {
            console.error('Failed to load admin leave requests', err);
        } finally {
            setAdminLoading(false);
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
    }, [activeTab, searchTerm, selectedDept, selectedLeaveType, selectedStatus]);

    const handleCancelRequest = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            await cancelLeaveRequest(id);
            loadMyTimeOff();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to cancel request');
        }
    };

    const handleApproveRequest = async (id: number) => {
        try {
            await approveLeaveRequest(id);
            loadAdminTimeOff();
            loadMyTimeOff();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to approve request');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800"><Check className="w-3 h-3 mr-1" /> Approved</span>;
            case 'REFUSED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" /> Refused</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-600"><Ban className="w-3 h-3 mr-1" /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-5 gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Time Off &amp; Leave Management</h1>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            activeTab === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-[#0052FF]'
                        }`}>
                            {activeTab === 'all' ? 'HR OVERSIGHT' : 'EMPLOYEE CENTER'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Submit leave requests, view entitlement balances, and manage team approvals.</p>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
                    {isAdmin && (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-4 py-2 text-xs font-black rounded-lg transition-colors flex items-center space-x-1.5 ${
                                    activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>My Time Off</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 text-xs font-black rounded-lg transition-colors flex items-center space-x-1.5 ${
                                    activeTab === 'all' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>All Leave Requests</span>
                            </button>
                        </div>
                    )}

                    <Button 
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-black text-xs px-4 h-10 space-x-1.5 rounded-xl shadow-md shadow-blue-500/10"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Request Time Off</span>
                    </Button>
                </div>
            </div>

            {activeTab === 'my' ? (
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
            ) : (
                /* Admin View */
                <div className="space-y-4">
                    {/* Admin Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                            <Input 
                                placeholder="Search employee name, code..." 
                                className="pl-9 h-10 text-xs rounded-xl"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                            value={selectedDept || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                            value={selectedLeaveType || ''}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedLeaveType(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">All Leave Types</option>
                            {leaveTypes.map(lt => (
                                <option key={lt.id} value={lt.id}>{lt.name}</option>
                            ))}
                        </select>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
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

                    {/* Admin Table */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {adminLoading ? (
                                <div className="p-8 text-center text-slate-400">Loading leave requests...</div>
                            ) : adminRequests.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No employee leave requests found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Employee</th>
                                                <th className="p-3.5">Department</th>
                                                <th className="p-3.5">Leave Type</th>
                                                <th className="p-3.5">Dates</th>
                                                <th className="p-3.5">Duration</th>
                                                <th className="p-3.5">Reason</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {adminRequests.map(req => (
                                                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                        <div>{req.employee_name || 'N/A'}</div>
                                                        <div className="font-mono text-[10px] text-slate-500 font-normal">{req.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600">{req.department_name || 'N/A'}</td>
                                                    <td className="p-3.5 font-bold text-slate-900">{req.leave_type_name}</td>
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
                                                    <td className="p-3.5 text-right pr-6 space-x-2">
                                                        {req.status === 'PENDING' ? (
                                                            <div className="flex justify-end space-x-1">
                                                                <button
                                                                    onClick={() => handleApproveRequest(req.id)}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setRefuseTargetId(req.id);
                                                                        setRefuseEmpName(req.employee_name || '');
                                                                    }}
                                                                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    Refuse
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 font-medium">--</span>
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
                leaveTypes={leaveTypes}
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={loadMyTimeOff}
            />

            <RefuseLeaveModal 
                requestId={refuseTargetId}
                employeeName={refuseEmpName}
                isOpen={!!refuseTargetId}
                onClose={() => setRefuseTargetId(null)}
                onSuccess={loadAdminTimeOff}
            />
        </div>
    );
}
