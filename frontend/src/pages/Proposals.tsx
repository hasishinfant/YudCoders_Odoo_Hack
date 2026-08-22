import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getAdminLeaveRequests, approveLeaveRequest, refuseLeaveRequest } from '@/services/leave';

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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-700 bg-slate-900 px-4 pt-4 rounded-t-xl overflow-hidden">
        <button 
          onClick={() => setActiveTab('Time Off')}
          className={`px-6 py-2.5 text-xs font-bold rounded-t-lg transition-colors ${activeTab === 'Time Off' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Time Off
        </button>
        <button 
          onClick={() => setActiveTab('Allocation')}
          className={`px-6 py-2.5 text-xs font-bold rounded-t-lg transition-colors ${activeTab === 'Allocation' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Allocation
        </button>
      </div>

      <div className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-700 p-6 shadow-xl text-slate-200">
        <div className="flex items-center justify-between mb-8">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded text-xs transition-colors shadow-lg shadow-purple-500/20">
            NEW
          </button>
          
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Searchbar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-slate-400 text-white placeholder:text-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* Balances Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8 border-b border-slate-700 pb-6 text-center">
          <div>
            <div className="text-blue-400 font-bold text-sm mb-1">Paid time Off</div>
            <div className="text-xs text-slate-400">24 Days Available</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold text-sm mb-1">Sick time off</div>
            <div className="text-xs text-slate-400">07 Days Available</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-3 font-bold text-slate-400 font-mono">Name</th>
                <th className="pb-3 font-bold text-slate-400 font-mono">Start Date</th>
                <th className="pb-3 font-bold text-slate-400 font-mono">End Date</th>
                <th className="pb-3 font-bold text-slate-400 font-mono">Time off Type</th>
                <th className="pb-3 font-bold text-slate-400 font-mono">Status</th>
                <th className="pb-3 font-bold text-slate-400 font-mono text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading requests...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No time off requests found.</td></tr>
              ) : (
                filtered.map(req => (
                  <tr key={req.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 font-semibold">{req.employee_name}</td>
                    <td className="py-4 font-mono text-slate-400">{req.start_date}</td>
                    <td className="py-4 font-mono text-slate-400">{req.end_date}</td>
                    <td className="py-4 text-blue-400 font-bold">{req.leave_type_name || 'Paid Time Off'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'APPROVED' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                        req.status === 'REFUSED' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                        'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleReject(req.id)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded transition-colors shadow-sm"
                            title="Reject"
                          />
                          <button 
                            onClick={() => handleApprove(req.id)}
                            className="w-6 h-6 bg-emerald-500 hover:bg-emerald-600 rounded transition-colors shadow-sm"
                            title="Approve"
                          />
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-500 font-bold uppercase">Done</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
