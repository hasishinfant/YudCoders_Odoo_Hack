import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Search, 
  Download, 
  Sparkles, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getAdminLeaveRequests, approveLeaveRequest, refuseLeaveRequest } from '@/services/leave';

interface ProposalItem {
  id: string;
  dbId?: number;
  type: string;
  title: string;
  category: 'Leave' | 'Expense' | 'Purchase' | 'Employee' | 'Policy';
  requester: string;
  department: string;
  designation: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dateRangeOrScope: string;
  reason: string;
  attachmentName?: string;
  attachmentSize?: string;
  aiPoints: string[];
  aiRecommendation: string;
  timeline: {
    title: string;
    date: string;
    user: string;
    details?: string;
    status: 'done' | 'current' | 'pending';
  }[];
}

const INITIAL_PROPOSALS: ProposalItem[] = [];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await getAdminLeaveRequests();
      const rawRequests = res.data || [];
      const formatted: ProposalItem[] = rawRequests.map((req: any) => {
        const dbId = req.id;
        const dur = req.duration_days || 1;
        const priority = dur > 3 ? 'High' : dur > 1 ? 'Medium' : 'Low';
        const formattedStatus = req.status === 'APPROVED' ? 'APPROVED' : req.status === 'REFUSED' ? 'REJECTED' : 'PENDING';
        
        // Format Date
        const submittedDateStr = new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + 
                                 new Date(req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const updatedDateStr = new Date(req.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + 
                               new Date(req.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return {
          id: `REQ-2026-${String(dbId).padStart(4, '0')}`,
          dbId: dbId,
          type: `${req.leave_type_name || 'Leave'} Request`,
          title: `${req.leave_type_name || 'Leave'} Request`,
          category: 'Leave',
          requester: req.employee_name || 'Unknown Staff',
          department: req.department_name || 'General',
          designation: req.employee_code || 'EMP',
          priority: priority,
          status: formattedStatus,
          dateRangeOrScope: `${req.start_date} to ${req.end_date} (${dur} Working Days)`,
          reason: req.reason || 'Medical / Personal leave request.',
          aiPoints: [
            `Employee holds ${req.employee_code || 'EMP'} identifier code.`,
            `Requested ${dur} days of ${req.leave_type_name || 'leave'}.`,
            `Coverage is stable in the ${req.department_name || 'General'} department.`,
            `Reason submitted: "${req.reason || 'Not specified'}"`
          ],
          aiRecommendation: dur > 4 ? 'Recommended: Review team schedule coverage.' : 'Recommended: Approve based on policy.',
          timeline: [
            { title: 'Submitted', date: submittedDateStr, user: req.employee_name || 'Staff Member', status: 'done' },
            { 
              title: 'HR Review', 
              date: formattedStatus === 'PENDING' ? 'Current Step' : updatedDateStr, 
              user: 'HR Manager (You)', 
              status: formattedStatus === 'PENDING' ? 'current' : 'done' 
            },
            { 
              title: 'Final Decision', 
              date: formattedStatus === 'PENDING' ? 'Pending' : updatedDateStr, 
              user: formattedStatus === 'PENDING' ? '' : formattedStatus === 'APPROVED' ? 'Approved by HR' : 'Refused by HR', 
              status: formattedStatus === 'PENDING' ? 'pending' : 'done' 
            }
          ]
        };
      });
      
      const merged = [...formatted, ...INITIAL_PROPOSALS];
      setProposals(merged);
      if (merged.length > 0) {
        setSelectedId(prev => prev || merged[0].id);
      }
    } catch (err) {
      console.error('Failed to load leave proposals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const selectedProposal = proposals.find(p => p.id === selectedId) || proposals[0];

  const handleAction = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const target = proposals.find(p => p.id === id);
    if (!target) return;

    if (target.dbId) {
      // Real database integration
      try {
        if (newStatus === 'APPROVED') {
          await approveLeaveRequest(target.dbId, 'Approved via HR Approvals Center.');
        } else {
          await refuseLeaveRequest(target.dbId, 'Refused by HR Admin.');
        }
        await fetchProposals();
      } catch (err) {
        console.error('Failed to update leave request status', err);
        alert('Failed to update request status on the server.');
      }
    } else {
      // Local fallback for static categories
      setProposals(prev => prev.map(p => {
        if (p.id === id) {
          const updatedTimeline = [...p.timeline];
          if (updatedTimeline[2]) updatedTimeline[2] = { ...updatedTimeline[2], status: 'done' };
          if (updatedTimeline[3]) {
            updatedTimeline[3] = { 
              title: 'Final Decision', 
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 
              user: newStatus === 'APPROVED' ? 'Approved by HR' : 'Rejected by HR', 
              status: 'done' 
            };
          }
          return { ...p, status: newStatus, timeline: updatedTimeline };
        }
        return p;
      }));
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.requester.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = catFilter === 'All' || p.category === catFilter;
    const matchesPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    return matchesSearch && matchesCat && matchesPriority;
  });

  const pendingCount = proposals.filter(p => p.status === 'PENDING').length;
  const highPriorityCount = proposals.filter(p => p.status === 'PENDING' && p.priority === 'High').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col overflow-hidden">
      {/* Header with Stats Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Proposals & Approvals</span>
            <span className="text-xl">📄</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review, analyze and take action on requests across the organization.</p>
        </div>

        {/* Action badges */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center shadow-xs">
            <span className="text-lg font-black text-amber-600 font-mono block leading-none">{String(pendingCount).padStart(2, '0')}</span>
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider mt-1 block">Pending</span>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-center shadow-xs">
            <span className="text-lg font-black text-orange-600 font-mono block leading-none">{String(highPriorityCount).padStart(2, '0')}</span>
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider mt-1 block">High Priority</span>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center shadow-xs">
            <span className="text-lg font-black text-[#0052FF] font-mono block leading-none">12</span>
            <span className="text-[9px] font-black text-[#0052FF] uppercase tracking-wider mt-1 block">This Week</span>
          </div>
        </div>
      </div>

      {/* Main 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto">
        
        {/* Column 1: Approval Queue (Width 4/12) */}
        <div className="lg:col-span-4 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Approval Queue</h2>
          
          {/* Search bar */}
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <Input 
              placeholder="Search requests..."
              className="h-10 pl-10 text-xs rounded-xl border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
            <select
              className="h-9 px-3 text-[10px] font-bold border rounded-xl bg-slate-50 border-slate-200 text-slate-700"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Leave">Leave Requests</option>
              <option value="Expense">Expense Requests</option>
              <option value="Purchase">Purchase Requests</option>
              <option value="Employee">Employee Requests</option>
              <option value="Policy">Policy Proposals</option>
            </select>

            <select
              className="h-9 px-3 text-[10px] font-bold border rounded-xl bg-slate-50 border-slate-200 text-slate-700"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* List Queue */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 italic text-center py-8">Syncing queue with database...</p>
            ) : filteredProposals.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No matching requests found.</p>
            ) : (
              filteredProposals.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all relative ${
                    selectedId === p.id 
                      ? 'bg-blue-50/40 border-[#0052FF] shadow-xs' 
                      : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{p.type}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{p.requester} • {p.department}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      p.status === 'APPROVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : p.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-[9px] font-bold text-slate-400 border-t border-slate-100 pt-2 flex-wrap gap-2">
                    <span className={`uppercase font-black tracking-wider ${
                      p.priority === 'High' ? 'text-orange-600' : 'text-slate-500'
                    }`}>{p.priority} Priority</span>
                    <span className="font-mono text-slate-500 truncate max-w-[180px]">{p.dateRangeOrScope}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-center shrink-0">
            <span className="text-[10px] font-black text-[#0052FF] hover:underline cursor-pointer flex items-center justify-center space-x-1">
              <span>View All Requests</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Column 2: Request Detail View (Width 5/12) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative">
          {selectedProposal ? (
            <div className="flex flex-col h-full min-h-0">
              {/* Type and Req ID */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-[#0052FF]" />
                    <span>{selectedProposal.type}</span>
                  </h3>
                  <span className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-wider block">Pending HR Review</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold block">Request ID</span>
                  <span className="text-xs font-black font-mono text-slate-800">{selectedProposal.id}</span>
                </div>
              </div>

              {/* Detail Contents scroll container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* User details */}
                <div className="flex items-center space-x-3.5 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100 flex items-center justify-center font-black text-sm uppercase">
                    {selectedProposal.requester.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{selectedProposal.requester}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">EMP00432</span>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Department</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedProposal.department}</span>
                  </div>
                  <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Designation</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedProposal.designation}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Duration / Scope</span>
                  <span className="text-xs font-bold text-slate-800 block mt-1 bg-slate-50/40 border border-slate-100 rounded-xl p-3">{selectedProposal.dateRangeOrScope}</span>
                </div>

                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Reason</span>
                  <span className="text-xs font-medium text-slate-700 block mt-1 bg-slate-50/40 border border-slate-100 rounded-xl p-3 leading-relaxed">{selectedProposal.reason}</span>
                </div>

                {/* Attachment */}
                {selectedProposal.attachmentName && (
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex justify-between items-center text-xs font-semibold text-slate-700">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      <div>
                        <span className="font-bold text-slate-800 block">{selectedProposal.attachmentName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{selectedProposal.attachmentSize}</span>
                      </div>
                    </div>
                    <button className="p-1.5 text-slate-500 hover:text-[#0052FF] transition-colors rounded-lg border border-slate-200 bg-white shadow-3xs">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* AI Summary Beta Container */}
                <div className="bg-blue-50/30 border border-blue-100/80 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#0052FF] uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>AI Summary</span>
                      <span className="text-[8px] font-black uppercase bg-[#0052FF] text-white px-1.5 rounded-sm">BETA</span>
                    </span>
                    <button className="text-[10px] font-bold text-[#0052FF] hover:underline">Regenerate</button>
                  </div>

                  <ul className="space-y-2 text-xs font-medium text-slate-700">
                    {selectedProposal.aiPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl flex items-start space-x-2 text-[11px] font-bold leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{selectedProposal.aiRecommendation}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="mt-4 border-t border-slate-100 pt-4 grid grid-cols-3 gap-2.5 shrink-0">
                {selectedProposal.status === 'PENDING' ? (
                  <>
                    <Button 
                      onClick={() => handleAction(selectedProposal.id, 'APPROVED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl"
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleAction(selectedProposal.id, 'REJECTED')}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 rounded-xl"
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-blue-150 hover:bg-blue-50/50 text-[#0052FF] font-bold text-xs h-10 rounded-xl"
                    >
                      Request Info
                    </Button>
                  </>
                ) : (
                  <div className={`col-span-3 text-center py-2.5 text-xs font-bold rounded-xl border ${
                    selectedProposal.status === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                      : 'bg-red-50 border-red-150 text-red-700'
                  }`}>
                    Request is {selectedProposal.status}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-12">Select a proposal to view details.</p>
          )}
        </div>

        {/* Column 3: Approval Timeline (Width 3/12) */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Approval Timeline</h2>

          {selectedProposal ? (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="space-y-5 relative pl-4 border-l border-slate-100 ml-2">
                {selectedProposal.timeline.map((node, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle marker */}
                    <span className={`absolute -left-[24px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                      node.status === 'done' 
                        ? 'border-emerald-500 text-emerald-500'
                        : node.status === 'current'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-slate-200 text-slate-400'
                    }`} />
                    
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                        <span>{node.title}</span>
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{node.date}</p>
                      {node.user && (
                        <p className="text-[10px] text-slate-500 font-bold mt-1">By {node.user}</p>
                      )}
                      {node.details && (
                        <p className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-lg mt-1.5 font-medium leading-relaxed italic">
                          "{node.details}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-center shrink-0">
                <span className="text-[10px] font-black text-[#0052FF] hover:underline cursor-pointer flex items-center justify-center space-x-1">
                  <span>View Review Details</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-12">Select a proposal to view timeline.</p>
          )}
        </div>

      </div>
    </div>
  );
}
