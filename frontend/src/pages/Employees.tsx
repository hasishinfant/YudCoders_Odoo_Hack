import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  getEmployees,
  createEmployee,
  type Employee,
  type EmployeeCreatePayload
} from '@/services/employees';
import { getAdminAttendance } from '@/services/attendance';
import { getDepartments, type Department } from '@/services/departments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  Grid, 
  List as ListIcon, 
  Mail, 
  Briefcase, 
  X,
  AlertCircle,
  CheckCircle2,
  Plane
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ login_id: string; initial_password: string } | null>(null);
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState<EmployeeCreatePayload>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    job_title: '',
    joining_date: new Date().toISOString().split('T')[0],
    date_of_birth: '1998-01-01',
    gender: 'Male',
    marital_status: 'Single',
    nationality: 'Indian',
    department_id: undefined,
    company_name: 'Dayflow',
    location: 'Noida Hub',
    avatar_url: ''
  });

  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [empRes, deptRes, attRes] = await Promise.all([
        getEmployees({
          q: search || undefined,
          department_id: deptFilter
        }),
        getDepartments(),
        getAdminAttendance({ date: today })
      ]);
      let list: Employee[] = empRes.data || [];
      if (statusFilter) {
        list = list.filter(e => e.employment_status === statusFilter);
      }
      setEmployees(list);
      setDepartments(deptRes.data || []);
      
      const map: Record<number, string> = {};
      const attRecords = attRes.data?.data || attRes.data || [];
      attRecords.forEach((r: any) => {
          map[r.employee_id] = r.status;
      });
      setAttendanceMap(map);
      
    } catch (err) {
      console.error('Failed to load employee directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, deptFilter, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setAddError('');
    setAddLoading(true);
    setCreatedCredentials(null);

    try {
      const res = await createEmployee(formData);
      setCreatedCredentials(res.credentials);
      loadData();
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to create employee');
    } finally {
      isSubmittingRef.current = false;
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage corporate workforce profiles, organizational units, and system access credentials.</p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <Button 
            onClick={() => {
              setCreatedCredentials(null);
              setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                address: '',
                job_title: '',
                joining_date: new Date().toISOString().split('T')[0],
                date_of_birth: '1998-01-01',
                gender: 'Male',
                marital_status: 'Single',
                nationality: 'Indian',
                department_id: undefined,
                company_name: 'Dayflow',
                location: 'Noida Hub',
                avatar_url: ''
              });
              setIsAddModalOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 h-10 space-x-1.5 rounded-xl shadow-md shadow-slate-900/10"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input 
            placeholder="Search name, email, employee code..." 
            className="pl-9 h-10 text-xs rounded-xl"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
          value={deptFilter || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setDeptFilter(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Employee Grid / Table Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading directory...</div>
      ) : employees.length === 0 ? (
        <div className="p-16 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">No employees match filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map(emp => (
            <Link key={emp.id} to={`/employees/${emp.id}`} className="block h-full group">
              <Card className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-[#0052FF]/30 transition-all duration-200 overflow-hidden flex flex-col justify-between h-full relative cursor-pointer">
                {/* Employee Card Content */}
                <CardContent className="p-6 space-y-4 flex-1">
                  <div className="flex items-start justify-between relative">
                    <div className="flex items-center space-x-3 flex-1 min-w-0 w-full pr-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] border border-blue-100 font-extrabold flex items-center justify-center text-base shadow-sm overflow-hidden shrink-0">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span>{emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 w-full">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#0052FF] transition-colors truncate block w-full" title={`${emp.first_name} ${emp.last_name}`}>
                          {emp.first_name} {emp.last_name}
                        </h3>
                        <span className="font-mono text-[11px] text-slate-500 font-medium block truncate w-full">{emp.employee_code}</span>
                      </div>
                    </div>
                    {/* Status Dot (Top Right) */}
                    <div className="absolute top-0 right-0" title={`Status: ${attendanceMap[emp.id] || 'ABSENT'}`}>
                        {attendanceMap[emp.id] === 'PRESENT' ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                        ) : attendanceMap[emp.id] === 'LEAVE' ? (
                            <div className="bg-[#0052FF] text-white rounded-full p-0.5 border-2 border-white shadow-2xs">
                                <Plane className="w-2.5 h-2.5" />
                            </div>
                        ) : attendanceMap[emp.id] === 'HALF_DAY' ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-2xs" />
                        ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-2xs" />
                        )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600 min-w-0 w-full">
                    <div className="flex items-center space-x-2 w-full min-w-0">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate block w-full">{emp.job_title || 'Employee'}</span>
                    </div>
                    <div className="flex items-center space-x-2 w-full min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate block w-full">{emp.department_name || 'Unassigned Dept'}</span>
                    </div>
                    <div className="flex items-center space-x-2 w-full min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate block w-full">{emp.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-white border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Employee</th>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Job Title</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-6 font-bold text-slate-900">
                        <div>{emp.first_name} {emp.last_name}</div>
                        <div className="text-slate-400 text-[10px] font-normal">{emp.email}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">{emp.employee_code}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{emp.job_title || 'N/A'}</td>
                      <td className="p-3.5">{emp.department_name || 'Unassigned'}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          emp.employment_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.employment_status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right pr-6">
                        <Link
                          to={`/employees/${emp.id}`}
                          className="text-slate-900 hover:text-emerald-700 font-bold text-xs"
                        >
                          Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
              <div className="text-lg font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#0052FF]" />
                <span>Onboard New Employee</span>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {addError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center text-xs font-semibold border border-red-200">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  {addError}
                </div>
              )}

              {createdCredentials ? (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Employee Account Provisioned!</span>
                  </div>
                  <p className="text-xs text-emerald-700">Display credentials ONCE. Provide these to the employee for first-time login.</p>
                  
                  <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Login ID:</span>
                      <strong className="text-slate-900">{createdCredentials.login_id}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Initial Password:</span>
                      <strong className="text-slate-900">{createdCredentials.initial_password}</strong>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  {/* Step 1: Personal Details */}
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                      <Input 
                        className="h-10 text-xs rounded-xl"
                        value={formData.first_name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                      <Input 
                        className="h-10 text-xs rounded-xl"
                        value={formData.last_name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <Input 
                        type="email"
                        className="h-10 text-xs rounded-xl"
                        value={formData.email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <Input 
                        className="h-10 text-xs rounded-xl"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.phone || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                    <Input 
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                      value={formData.avatar_url || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                      <Input 
                        type="date"
                        className="h-10 text-xs rounded-xl"
                        value={formData.date_of_birth || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                      <select
                        className="w-full h-10 px-3 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/35 font-semibold text-slate-700"
                        value={formData.gender || ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status *</label>
                      <select
                        className="w-full h-10 px-3 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/35 font-semibold text-slate-700"
                        value={formData.marital_status || ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, marital_status: e.target.value })}
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 2: Employment & Company Info */}
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-2">Employment Information</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                      <Input 
                        className="h-10 text-xs rounded-xl"
                        placeholder="e.g. Senior Software Engineer"
                        value={formData.job_title || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, job_title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                      <select
                        className="w-full h-10 px-3 text-xs border rounded-xl bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/35 font-semibold text-slate-700"
                        value={formData.department_id || ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : undefined })}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
                      <Input 
                        type="date"
                        className="h-10 text-xs rounded-xl"
                        value={formData.joining_date || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, joining_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
                      <Input 
                        className="h-10 text-xs rounded-xl"
                        placeholder="e.g. Noida Office"
                        value={formData.location || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality *</label>
                      <Input 
                        className="h-10 text-xs rounded-xl"
                        value={formData.nationality || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nationality: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address *</label>
                    <Input 
                      className="h-10 text-xs rounded-xl"
                      placeholder="Enter employee's full residential address"
                      value={formData.address || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)} 
                      className="text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-xl shadow-md"
                      disabled={addLoading}
                    >
                      {addLoading ? 'Creating Profile...' : 'Complete Onboarding'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
