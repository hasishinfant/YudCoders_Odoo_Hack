import { useState, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees, setEmployeeStatus, type Employee, type EmployeeCreateResponse } from '@/services/employees';
import { getDepartments, type Department } from '@/services/departments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, UserPlus, Building2, Mail, MapPin } from 'lucide-react';
import AddEmployeeModal from '@/components/employees/AddEmployeeModal';
import CredentialsModal from '@/components/employees/CredentialsModal';

export default function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [createdCredentialData, setCreatedCredentialData] = useState<EmployeeCreateResponse | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empRes, deptRes] = await Promise.all([
                getEmployees({ q: searchTerm, department_id: selectedDept }),
                getDepartments()
            ]);
            setEmployees(empRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error('Failed to load employees', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, selectedDept]);

    const handleEmployeeCreated = (data: EmployeeCreateResponse) => {
        setIsAddModalOpen(false);
        setCreatedCredentialData(data);
        loadData();
    };

    const handleToggleStatus = async (e: MouseEvent, emp: Employee) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to ${emp.user_active ? 'deactivate' : 'activate'} ${emp.first_name} ${emp.last_name}?`)) {
            try {
                await setEmployeeStatus(emp.id, !emp.user_active);
                loadData();
            } catch (err) {
                alert('Failed to update status');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage employee records, provision accounts, and organizational structure.</p>
                </div>
                <Button 
                    className="bg-slate-900 hover:bg-slate-800 space-x-2 shrink-0"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Employee</span>
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input 
                        placeholder="Search by name, Login ID, email, or position..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="w-full sm:w-64 h-10 px-3 py-2 text-sm border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    value={selectedDept || ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            {/* Employees Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : employees.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-6">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-800">No employees found</h3>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or add a new employee record.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map(emp => (
                        <Card 
                            key={emp.id}
                            className="bg-white hover:shadow-md transition-all border-slate-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                            onClick={() => navigate(`/employees/${emp.id}`)}
                        >
                            <CardContent className="p-5 space-y-4">
                                {/* Card Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                            {emp.avatar_url ? (
                                                <img src={emp.avatar_url} alt={emp.first_name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                `${emp.first_name[0]}${emp.last_name[0]}`
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                                                {emp.first_name} {emp.last_name}
                                            </h3>
                                            <span className="inline-block text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded mt-1 border border-slate-200">
                                                {emp.employee_code}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <button 
                                        onClick={(e) => handleToggleStatus(e, emp)}
                                        title={emp.user_active ? "Deactivate employee" : "Activate employee"}
                                        className="shrink-0"
                                    >
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            emp.user_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                emp.user_active ? 'bg-emerald-500' : 'bg-slate-400'
                                            }`} />
                                            {emp.user_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </button>
                                </div>

                                {/* Job Details */}
                                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                                    <div className="flex items-center font-medium text-slate-800 text-sm">
                                        {emp.job_title || 'Employee'}
                                    </div>
                                    
                                    {emp.department_name && (
                                        <div className="flex items-center space-x-1.5 text-slate-500">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span>{emp.department_name}</span>
                                        </div>
                                    )}

                                    {emp.email && (
                                        <div className="flex items-center space-x-1.5 text-slate-500 truncate">
                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{emp.email}</span>
                                        </div>
                                    )}

                                    {emp.location && (
                                        <div className="flex items-center space-x-1.5 text-slate-500">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            <span>{emp.location}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AddEmployeeModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleEmployeeCreated}
            />

            {createdCredentialData && (
                <CredentialsModal 
                    data={createdCredentialData}
                    onClose={() => setCreatedCredentialData(null)}
                />
            )}
        </div>
    );
}
