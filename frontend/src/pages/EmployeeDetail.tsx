import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById, getMyProfile, updateEmployee, updateMyProfile, type Employee } from '@/services/employees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
    User as UserIcon, 
    Shield, 
    Briefcase, 
    Award, 
    FileText, 
    Lock, 
    ArrowLeft,
    Check,
    Edit3
} from 'lucide-react';

interface EmployeeDetailProps {
    isSelfProfile?: boolean;
}

export default function EmployeeDetail({ isSelfProfile = false }: EmployeeDetailProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'about' | 'private' | 'skills' | 'certifications' | 'security' | 'salary'>('about');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [saveMessage, setSaveMessage] = useState('');
    const [error, setError] = useState('');

    const isAdmin = currentUser?.role === 'ADMIN';

    const loadEmployee = async () => {
        setLoading(true);
        try {
            let res;
            if (isSelfProfile) {
                res = await getMyProfile();
            } else if (id) {
                res = await getEmployeeById(Number(id));
            }
            if (res?.data) {
                setEmployee(res.data);
                setFormData(res.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load employee details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployee();
    }, [id, isSelfProfile]);

    const handleSave = async () => {
        if (!employee) return;
        setError('');
        try {
            if (isAdmin && !isSelfProfile) {
                await updateEmployee(employee.id, formData);
            } else {
                await updateMyProfile({
                    phone: formData.phone,
                    address: formData.address,
                    avatar_url: formData.avatar_url,
                    about: formData.about,
                    skills: formData.skills,
                    certifications: formData.certifications
                });
            }
            setSaveMessage('Profile saved successfully!');
            setIsEditing(false);
            loadEmployee();
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save changes');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading employee details...</div>;
    }

    if (error || !employee) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-red-600 font-semibold">{error || 'Employee record not found.'}</p>
                <Button variant="outline" onClick={() => navigate('/employees')}>
                    Back to Directory
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="space-x-2 text-slate-600" onClick={() => navigate('/employees')}>
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Directory</span>
                </Button>
                {saveMessage && (
                    <span className="text-sm font-medium text-emerald-600 flex items-center bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                        <Check className="w-4 h-4 mr-1" /> {saveMessage}
                    </span>
                )}
            </div>

            {/* Profile Header Card */}
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-slate-900 to-slate-800" />
                <CardContent className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between -mt-12 mb-4 gap-4">
                        <div className="flex items-end space-x-4">
                            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg shrink-0">
                                <div className="w-full h-full rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-2xl text-slate-700">
                                    {employee.avatar_url ? (
                                        <img src={employee.avatar_url} alt={employee.first_name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        `${employee.first_name[0]}${employee.last_name[0]}`
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-2xl font-bold text-slate-900">{employee.first_name} {employee.last_name}</h1>
                                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded">
                                        {employee.employee_code}
                                    </span>
                                </div>
                                <p className="text-slate-600 font-medium text-sm mt-0.5">{employee.job_title || 'Employee'} • {employee.department_name || 'General'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={handleSave}>Save Changes</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" className="space-x-1.5" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Profile</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Metadata Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
                        <div>
                            <span className="text-slate-400 block font-medium">Company</span>
                            <span className="font-semibold text-slate-800">{employee.company_name || 'Dayflow'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Work Email</span>
                            <span className="font-semibold text-slate-800">{employee.email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Date of Joining</span>
                            <span className="font-semibold text-slate-800">{employee.joining_date || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Account Status</span>
                            <span className={`font-semibold inline-flex items-center ${employee.user_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${employee.user_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {employee.user_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Odoo Profile Tabs */}
            <div className="space-y-4">
                <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-lg border">
                    {[
                        { id: 'about', label: 'Resume / About', icon: FileText },
                        { id: 'private', label: 'Private Information', icon: UserIcon },
                        { id: 'skills', label: 'Skills', icon: Briefcase },
                        { id: 'certifications', label: 'Certifications', icon: Award },
                        { id: 'security', label: 'Security', icon: Shield },
                        { id: 'salary', label: 'Salary Information', icon: Lock }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                                    active 
                                        ? 'border-slate-900 text-slate-900' 
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-6">
                        {activeTab === 'about' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">About Employee</h3>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-32 p-3 border rounded-md text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Write resume summary, bio, or professional background..."
                                        value={formData.about || ''}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, about: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                        {employee.about || 'No resume / about details added yet.'}
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === 'private' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact & Location</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 block mb-1">Phone Number</label>
                                        {isEditing ? (
                                            <Input 
                                                value={formData.phone || ''} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })} 
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-slate-800">{employee.phone || 'N/A'}</span>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 block mb-1">Location</label>
                                        {isEditing && isAdmin ? (
                                            <Input 
                                                value={formData.location || ''} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })} 
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-slate-800">{employee.location || 'N/A'}</span>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500 block mb-1">Address</label>
                                        {isEditing ? (
                                            <Input 
                                                value={formData.address || ''} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })} 
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-slate-800">{employee.address || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'skills' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Skills & Competencies</h3>
                                {isEditing ? (
                                    <Input 
                                        placeholder="e.g. React, TypeScript, Python, PostgreSQL, Odoo" 
                                        value={formData.skills || ''} 
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, skills: e.target.value })} 
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {employee.skills ? (
                                            employee.skills.split(',').map((skill, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full border border-slate-200">
                                                    {skill.trim()}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-slate-500">No skills listed.</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'certifications' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Certifications</h3>
                                {isEditing ? (
                                    <Input 
                                        placeholder="e.g. AWS Certified Developer, Odoo Certified Professional" 
                                        value={formData.certifications || ''} 
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, certifications: e.target.value })} 
                                    />
                                ) : (
                                    <p className="text-slate-700 text-sm">
                                        {employee.certifications || 'No certifications recorded.'}
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Security</h3>
                                <p className="text-xs text-slate-600">Password and authentication settings for this account.</p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => navigate('/change-password')}
                                >
                                    Change Password
                                </Button>
                            </div>
                        )}

                        {activeTab === 'salary' && (
                            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-2">
                                <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                                <h4 className="font-bold text-slate-800">Salary & Compensation Module</h4>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    Salary details (Basic, HRA, Allowances, Deductions) are strictly restricted and will be unlocked in the upcoming Phase 6 Salary Module.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
