import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDepartments, type Department } from '@/services/departments';
import { createEmployee, type EmployeeCreatePayload, type EmployeeCreateResponse } from '@/services/employees';
import { AlertCircle, X, UserPlus } from 'lucide-react';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: EmployeeCreateResponse) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState<EmployeeCreatePayload>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        job_title: '',
        joining_date: new Date().toISOString().split('T')[0],
        department_id: undefined,
        company_name: 'Odoo India',
        location: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getDepartments()
                .then(res => setDepartments(res.data || []))
                .catch(() => {});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.first_name || !formData.last_name || !formData.email) {
            setError('First name, last name, and email are required.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await createEmployee(formData);
            if (res.success) {
                onSuccess(res.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create employee');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl bg-white shadow-2xl my-8">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <UserPlus className="w-5 h-5 text-slate-800" />
                            <CardTitle className="text-xl font-bold">Add New Employee</CardTitle>
                        </div>
                        <CardDescription>
                            Provision a new employee record. System will auto-generate Login ID & Password.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-slate-500" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-sm font-medium">
                                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">First Name *</label>
                                <Input 
                                    required 
                                    placeholder="John"
                                    value={formData.first_name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, first_name: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Last Name *</label>
                                <Input 
                                    required 
                                    placeholder="Doe"
                                    value={formData.last_name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, last_name: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Work Email *</label>
                                <Input 
                                    type="email"
                                    required 
                                    placeholder="john.doe@company.com"
                                    value={formData.email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Phone Number</label>
                                <Input 
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Company Name</label>
                                <Input 
                                    placeholder="Odoo India"
                                    value={formData.company_name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, company_name: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Department</label>
                                <select
                                    className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950"
                                    value={formData.department_id || ''}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, department_id: e.target.value ? Number(e.target.value) : undefined})}
                                    disabled={isLoading}
                                >
                                    <option value="">-- Select Department --</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Job Title / Position</label>
                                <Input 
                                    placeholder="Software Engineer"
                                    value={formData.job_title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, job_title: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-600">Date of Joining</label>
                                <Input 
                                    type="date"
                                    value={formData.joining_date}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, joining_date: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-slate-600">Work Location</label>
                            <Input 
                                placeholder="Gandhinagar, Gujarat / Remote"
                                value={formData.location}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500">
                            <strong>Note:</strong> Login ID will be formatted automatically as <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">[Company][Initials][Year][Serial]</code> (e.g. OIJD20230001). Initial password will be shown upon submission.
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
                            {isLoading ? "Provisioning..." : "Create Employee"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
