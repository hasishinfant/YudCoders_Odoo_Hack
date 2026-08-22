import { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { getAdminLeaveRequests, approveLeaveRequest, refuseLeaveRequest } from '@/services/leave';
import { Card } from '@/components/ui/card';

export default function ProposalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Time Off' | 'Allocation'>('Time Off');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAdminLeaveRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load leave requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveLeaveRequest(id, 'Approved by Admin');
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await refuseLeaveRequest(id, 'Rejected by Admin');
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = requests.filter(r => 
    r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.leave_type_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#0052FF]" />
            Time Off Approvals
          </h1>
          <p className="text-xs text-slate-500 font-medium">Review and process leave applications across the organization.</p>
        </div>
      </div>

      <div className="flex items-center space-x-1 border-b border-slate-200 bg-white px-4 pt-4 rounded-t-2xl border border-b-0 border-slate-200/80 shadow-2xs">
        <button 
          onClick={() => setActiveTab('Time Off')}
          className={`px-6 py-2.5 text-xs font-black rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'Time Off' ? 'border-[#0052FF] text-[#0052FF]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Time Off
        </button>
        <button 
          onClick={() => setActiveTab('Allocation')}
          className={`px-6 py-2.5 text-xs font-black rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'Allocation' ? 'border-[#0052FF] text-[#0052FF]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Allocation
        </button>
      </div>

      <Card className="bg-white rounded-b-2xl rounded-tr-2xl border border-slate-200/80 p-6 shadow-sm text-slate-700">
        <div className="flex items-center justify-between mb-8">
          <button className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-blue-500/10">
            New Allocation
          </button>
          
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search employee or leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Balances Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 border-b border-slate-100 pb-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
            <div className="text-[#0052FF] font-bold text-xs uppercase tracking-wider mb-1">Company Paid time Off</div>
            <div className="text-lg font-black text-slate-800">24 Days Average</div>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-center">
            <div className="text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">Company Sick time off</div>
            <div className="text-lg font-black text-slate-800">07 Days Average</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="pb-3 font-bold uppercase tracking-wider pl-4">Name</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Start Date</th>
                <th className="pb-3 font-bold uppercase tracking-wider">End Date</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Time off Type</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                <th className="pb-3 font-bold uppercase tracking-wider text-center pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Loading requests...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No time off requests found.</td></tr>
              ) : (
                filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 pl-4 font-bold text-slate-900">{req.employee_name}</td>
                    <td className="py-4 font-mono font-medium text-slate-500">{req.start_date}</td>
                    <td className="py-4 font-mono font-medium text-slate-500">{req.end_date}</td>
                    <td className="py-4 text-[#0052FF] font-bold">{req.leave_type_name || 'Paid Time Off'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        req.status === 'REFUSED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleReject(req.id)}
                            className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                            title="Reject"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <button 
                            onClick={() => handleApprove(req.id)}
                            className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                            title="Approve"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">Processed</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
