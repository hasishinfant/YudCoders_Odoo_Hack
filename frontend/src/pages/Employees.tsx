import { useState, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  getEmployees,
  createEmployee,
  type Employee,
  type EmployeeCreatePayload
} from '@/services/employees';
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
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2
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

  const [formData, setFormData] = useState<EmployeeCreatePayload>({
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    department_id: undefined
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        getEmployees({
          q: search || undefined,
          department_id: deptFilter
        }),
        getDepartments()
      ]);
      let list: Employee[] = empRes.data || [];
      if (statusFilter) {
        list = list.filter(e => e.employment_status === statusFilter);
      }
      setEmployees(list);
      setDepartments(deptRes.data || []);
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
              setFormData({ first_name: '', last_name: '', email: '', job_title: '', department_id: undefined });
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
            <Card key={emp.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 font-extrabold flex items-center justify-center text-base shadow-md shadow-slate-900/10">
                      {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <span className="font-mono text-[11px] text-slate-500 font-medium block">{emp.employee_code}</span>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    emp.employment_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.employment_status || 'ACTIVE'}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{emp.job_title || 'Employee'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.department_name || 'Unassigned Dept'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>
              </CardContent>

              <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/employees/${emp.id}`}
                  className="text-slate-900 hover:text-emerald-700 font-bold text-xs flex items-center space-x-1"
                >
                  <span>View Profile</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
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
          <Card className="w-full max-w-lg bg-white border-slate-200 shadow-2xl overflow-hidden rounded-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
              <div className="text-lg font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Create New Employee</span>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        First Name
                      </label>
                      <Input 
                        className="h-10 text-xs"
                        value={formData.first_name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Last Name
                      </label>
                      <Input 
                        className="h-10 text-xs"
                        value={formData.last_name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <Input 
                      type="email"
                      className="h-10 text-xs"
                      value={formData.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Job Title
                      </label>
                      <Input 
                        className="h-10 text-xs"
                        value={formData.job_title || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, job_title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Department
                      </label>
                      <select
                        className="w-full h-10 px-3 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                        value={formData.department_id || ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : undefined })}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)} 
                      className="text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5"
                      disabled={addLoading}
                    >
                      {addLoading ? 'Creating...' : 'Provision Credentials'}
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
