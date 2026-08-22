import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById, getMyProfile, updateEmployee, updateMyProfile, type Employee } from '@/services/employees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Lock, 
  Check,
  Edit3,
  Download,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  QrCode,
  Info,
  KeyRound,
  Smartphone,
  CreditCard,
  X
} from 'lucide-react';

interface EmployeeDetailProps {
    isSelfProfile?: boolean;
}

export default function EmployeeDetail({ isSelfProfile = true }: EmployeeDetailProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'compensation' | 'bank' | 'documents'>('personal');
    
    // Edit Modes & Inputs
    const [editingField, setEditingField] = useState<'name' | 'phone' | 'address' | null>(null);
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');

    // Interactive ID Card Flip State (Must NOT flip on hover, ONLY on click)
    const [isIdCardFlipped, setIsIdCardFlipped] = useState(false);

    // Account & Security Interactive Controls
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [devicesModalOpen, setDevicesModalOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    // Notifications
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const isAdmin = currentUser?.role === 'ADMIN';

    const loadEmployee = async () => {
        setLoading(true);
        try {
            let res;
            if (isSelfProfile || !id) {
                res = await getMyProfile();
            } else if (id) {
                res = await getEmployeeById(Number(id));
            }
            if (res?.data) {
                const data = res.data;
                setEmployee(data);
                setEditFullName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
                setEditPhone(data.phone || '+91 98765 43210');
                setEditAddress(data.address || 'Koramangala, Bengaluru, Karnataka - 560034');
            }
        } catch (err: any) {
            console.error('Failed to load profile data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployee();
    }, [id, isSelfProfile]);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Save field updates
    const handleSaveField = async (field: 'name' | 'phone' | 'address') => {
        if (!employee) return;
        try {
            let payload: any = {};
            if (field === 'name') {
                const parts = editFullName.trim().split(' ');
                const firstName = parts[0] || 'Kaaysha';
                const lastName = parts.slice(1).join(' ') || 'Rao';
                payload = { first_name: firstName, last_name: lastName };
            } else if (field === 'phone') {
                payload = { phone: editPhone };
            } else if (field === 'address') {
                payload = { address: editAddress };
            }

            if (isAdmin && !isSelfProfile) {
                await updateEmployee(employee.id, payload);
            } else {
                await updateMyProfile(payload);
            }

            showToast(`Updated ${field === 'name' ? 'Full Name' : field === 'phone' ? 'Phone Number' : 'Address'} successfully!`);
            setEditingField(null);
            loadEmployee();
        } catch (err: any) {
            showToast(err.response?.data?.detail || 'Failed to update profile info', 'error');
        }
    };

    // Download My Data feature
    const handleDownloadData = () => {
        if (!employee) return;
        const dataReport = {
            title: "Dayflow HRMS — Official Employee Data Export",
            export_timestamp: new Date().toISOString(),
            employee_code: employee.employee_code || "EMP00123",
            full_name: `${employee.first_name} ${employee.last_name}`,
            job_title: employee.job_title || "Software Engineer",
            department: employee.department_name || "Engineering",
            email: employee.email || "kaaysha.rao@dayflow.com",
            phone: employee.phone || "+91 98765 43210",
            address: employee.address || "Koramangala, Bengaluru, Karnataka - 560034",
            date_of_birth: "20 Nov 2003",
            gender: "Female",
            marital_status: "Single",
            nationality: "Indian",
            employment_status: employee.employment_status || "ACTIVE",
            company: employee.company_name || "Dayflow Inc.",
            joining_date: employee.joining_date || "15 Aug 2023"
        };

        const blob = new Blob([JSON.stringify(dataReport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dayflow_${employee.first_name || 'Kaaysha'}_${employee.employee_code || 'EMP00123'}_Data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Employee profile data exported successfully!");
    };

    if (loading) {
        return (
            <div className="p-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading profile data...</p>
            </div>
        );
    }

    const nameDisplay = employee ? `${employee.first_name} ${employee.last_name}` : 'Kaaysha Rao';
    const codeDisplay = employee?.employee_code || 'EMP00123';
    const titleDisplay = employee?.job_title || 'Software Engineer';
    const emailDisplay = employee?.email || 'kaaysha.rao@dayflow.com';
    const phoneDisplay = employee?.phone || '+91 98765 43210';
    const addressDisplay = employee?.address || 'Koramangala, Bengaluru, Karnataka - 560034';
    const deptDisplay = employee?.department_name || 'Engineering';

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold text-white transition-all ${
                    toastMessage.type === 'success' ? 'bg-[#0052FF]' : 'bg-red-600'
                }`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Page Header & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium mt-0.5">
                        <Link to="/" className="hover:text-[#0052FF]">Dashboard</Link>
                        <span>&gt;</span>
                        <span className="text-slate-700 font-bold">My Profile</span>
                    </div>
                </div>

                <Button
                    onClick={handleDownloadData}
                    variant="outline"
                    className="bg-white text-[#0052FF] border-[#0052FF]/30 hover:bg-blue-50 font-bold text-xs px-4 h-10 rounded-xl space-x-2 shadow-2xs self-start sm:self-auto"
                >
                    <Download className="w-4 h-4 text-[#0052FF]" />
                    <span>Download My Data</span>
                </Button>
            </div>

            {/* 1. HERO PROFILE SECTION (Exact Layout Match with 3D Flip ID Card) */}
            <Card className="bg-white border-slate-200/80 rounded-3xl shadow-sm overflow-hidden p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Left Container: Solid Electric Blue Card */}
                    <div className="lg:col-span-4 bg-[#0052FF] text-white p-6 rounded-2xl relative flex flex-col items-center text-center shadow-lg shadow-blue-500/20">
                        {/* Status Pill */}
                        <div className="absolute top-4 right-4 bg-white/90 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                        </div>

                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl my-2">
                            <img 
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop" 
                                alt={nameDisplay}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>

                        <h2 className="text-xl font-black text-white tracking-tight mt-1">{nameDisplay}</h2>
                        <span className="font-mono text-xs text-blue-200 font-bold mt-0.5">{codeDisplay}</span>
                        <p className="text-xs text-blue-100 font-medium mt-0.5">{titleDisplay}</p>

                        {/* Button: "ID Card" (Flips the card on click!) */}
                        <button
                            onClick={() => setIsIdCardFlipped(!isIdCardFlipped)}
                            className="mt-4 bg-white text-[#0052FF] hover:bg-blue-50 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2"
                        >
                            <CreditCard className="w-4 h-4 text-[#0052FF]" />
                            <span>ID Card</span>
                        </button>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="lg:col-span-4 space-y-4 text-xs">
                        <div className="space-y-1">
                            <span className="text-slate-400 font-semibold block text-[11px]">Email Address</span>
                            <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-800">{emailDisplay}</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.2 rounded-full flex items-center">
                                    <Check className="w-3 h-3 mr-0.5" /> Verified
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-slate-400 font-semibold block text-[11px]">Phone Number</span>
                            <div className="flex items-center justify-between pr-4">
                                <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="font-bold text-slate-800">{phoneDisplay}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingField('phone');
                                        setActiveTab('personal');
                                    }}
                                    className="text-[#0052FF] hover:bg-blue-50 border border-[#0052FF]/30 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-slate-400 font-semibold block text-[11px]">Address</span>
                            <div className="flex items-start justify-between pr-4">
                                <div className="flex items-start space-x-2 pr-2">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="font-bold text-slate-800 leading-snug">{addressDisplay}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingField('address');
                                        setActiveTab('personal');
                                    }}
                                    className="text-[#0052FF] hover:bg-blue-50 border border-[#0052FF]/30 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 shrink-0"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Far Right Profile Info & Interactive 3D Flip ID Card */}
                    <div className="lg:col-span-4 grid grid-cols-2 gap-4 items-center border-l border-slate-100 pl-6">
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date of Birth</span>
                                <span className="font-extrabold text-slate-900">20 Nov 2003</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Gender</span>
                                <span className="font-extrabold text-slate-900">Female</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Marital Status</span>
                                <span className="font-extrabold text-slate-900">Single</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Nationality</span>
                                <span className="font-extrabold text-slate-900">Indian</span>
                            </div>
                        </div>

                        {/* Interactive 3D Flip ID Card Container */}
                        <div 
                            className="perspective-1000 cursor-pointer"
                            onClick={() => setIsIdCardFlipped(!isIdCardFlipped)}
                            title="Click to flip ID Card"
                        >
                            <div className={`relative w-48 h-64 rounded-2xl shadow-xl transition-transform duration-700 transform-style-preserve-3d ${
                                isIdCardFlipped ? 'rotate-y-180' : ''
                            }`}>
                                {/* Front Side of ID Card */}
                                <div className="absolute inset-0 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between backface-hidden overflow-hidden">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 rounded-lg bg-[#0052FF] flex items-center justify-center font-bold text-white text-xs">D</div>
                                        <div>
                                            <span className="font-black text-xs text-slate-900 block leading-tight">Dayflow</span>
                                            <span className="text-[8px] text-slate-400 font-semibold block">HR Management System</span>
                                        </div>
                                    </div>

                                    <div className="text-center my-1">
                                        <div className="w-14 h-14 rounded-full bg-slate-200 mx-auto overflow-hidden border-2 border-[#0052FF] mb-1">
                                            <img 
                                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" 
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h4 className="font-black text-xs text-slate-900 leading-tight">{nameDisplay}</h4>
                                        <span className="font-mono text-[10px] text-slate-500 font-bold block">{codeDisplay}</span>
                                        <span className="text-[9px] text-[#0052FF] font-extrabold block">{titleDisplay}</span>
                                    </div>

                                    <div className="text-[9px] space-y-0.5 border-t border-slate-100 pt-1.5 text-slate-600">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Department:</span>
                                            <strong className="text-slate-900">{deptDisplay}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Employee Type:</span>
                                            <strong className="text-slate-900">Full Time</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">DOJ:</span>
                                            <strong className="text-slate-900">15 Aug 2023</strong>
                                        </div>
                                    </div>

                                    {/* Barcode Graphic & Orange Curve */}
                                    <div className="flex items-end justify-between pt-1 relative">
                                        <div className="font-mono text-[10px] tracking-widest text-slate-800 font-black">
                                            ||| | |||| || | |||
                                        </div>
                                        <div className="w-8 h-8 bg-amber-500 rounded-tl-full absolute -right-4 -bottom-4 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Back Side of ID Card */}
                                <div className="absolute inset-0 bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between rotate-y-180 backface-hidden overflow-hidden border border-slate-800">
                                    <div className="w-full h-6 bg-slate-800 -mx-4 -mt-4 mb-2" />
                                    
                                    <div className="space-y-2 text-center">
                                        <div className="bg-white p-2 rounded-xl inline-block shadow-md">
                                            <QrCode className="w-10 h-10 text-slate-900" />
                                        </div>
                                        <p className="text-[9px] text-slate-300 font-mono">ID: {codeDisplay}</p>
                                    </div>

                                    <div className="text-[8px] text-slate-400 space-y-1 border-t border-slate-800 pt-2 leading-tight">
                                        <p><strong className="text-white">Emergency Contact:</strong> +91 98765 00000</p>
                                        <p><strong className="text-white">Issue Date:</strong> 15 Aug 2023</p>
                                        <p className="text-[7px] text-slate-500 italic">Property of Dayflow Inc. If found, please return to HR Department.</p>
                                    </div>

                                    <div className="text-center text-[9px] font-bold text-blue-400 uppercase tracking-widest pt-1 border-t border-slate-800">
                                        Authorized ID Card
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </Card>

            {/* 2. MAIN SECTION (Left Tabs & Form, Right Account & Security Cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Panel: Tabs & Form (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Profile Tabs */}
                    <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl border border-slate-200/80 overflow-x-auto">
                        {[
                            { id: 'personal', label: 'Personal Information' },
                            { id: 'job', label: 'Job Information' },
                            { id: 'compensation', label: 'Compensation' },
                            { id: 'bank', label: 'Bank & Tax Details' },
                            { id: 'documents', label: 'Documents' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                        ? 'border-[#0052FF] text-[#0052FF] font-black' 
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Form Card */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                            {activeTab === 'personal' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* Full Name (EDITABLE) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                                            {editingField === 'name' ? (
                                                <div className="flex items-center space-x-2">
                                                    <Input 
                                                        value={editFullName}
                                                        onChange={(e) => setEditFullName(e.target.value)}
                                                        className="h-10 text-xs rounded-xl"
                                                    />
                                                    <Button size="sm" className="bg-[#0052FF] text-white font-bold h-10 px-3 rounded-xl" onClick={() => handleSaveField('name')}>Save</Button>
                                                    <Button size="sm" variant="outline" className="h-10 px-3 rounded-xl" onClick={() => setEditingField(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-900">{nameDisplay}</span>
                                                    <button 
                                                        onClick={() => setEditingField('name')}
                                                        className="text-[#0052FF] hover:bg-blue-50 border border-[#0052FF]/30 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Address (EDITABLE) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Address</label>
                                            {editingField === 'address' ? (
                                                <div className="flex items-center space-x-2">
                                                    <Input 
                                                        value={editAddress}
                                                        onChange={(e) => setEditAddress(e.target.value)}
                                                        className="h-10 text-xs rounded-xl"
                                                    />
                                                    <Button size="sm" className="bg-[#0052FF] text-white font-bold h-10 px-3 rounded-xl" onClick={() => handleSaveField('address')}>Save</Button>
                                                    <Button size="sm" variant="outline" className="h-10 px-3 rounded-xl" onClick={() => setEditingField(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-900 truncate pr-2">{addressDisplay}</span>
                                                    <button 
                                                        onClick={() => setEditingField('address')}
                                                        className="text-[#0052FF] hover:bg-blue-50 border border-[#0052FF]/30 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 shrink-0"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Email Address (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">{emailDisplay}</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Gender (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gender</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">Female</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Phone Number (EDITABLE) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                                            {editingField === 'phone' ? (
                                                <div className="flex items-center space-x-2">
                                                    <Input 
                                                        value={editPhone}
                                                        onChange={(e) => setEditPhone(e.target.value)}
                                                        className="h-10 text-xs rounded-xl"
                                                    />
                                                    <Button size="sm" className="bg-[#0052FF] text-white font-bold h-10 px-3 rounded-xl" onClick={() => handleSaveField('phone')}>Save</Button>
                                                    <Button size="sm" variant="outline" className="h-10 px-3 rounded-xl" onClick={() => setEditingField(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-900">{phoneDisplay}</span>
                                                    <button 
                                                        onClick={() => setEditingField('phone')}
                                                        className="text-[#0052FF] hover:bg-blue-50 border border-[#0052FF]/30 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Marital Status (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Marital Status</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">Single</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Date of Birth (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">20 Nov 2003</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Nationality (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nationality</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">Indian</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                    </div>

                                    {/* Blue Notice Banner */}
                                    <div className="bg-blue-50/80 border border-blue-200/80 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold text-[#0052FF]">
                                        <Info className="w-4 h-4 shrink-0 text-[#0052FF]" />
                                        <span>You can only edit your Name, Phone Number and Address.</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'job' && (
                                <div className="space-y-3 text-xs">
                                    <h3 className="font-extrabold text-slate-900 text-sm">Job Information</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div><span className="text-slate-400 block font-semibold">Job Title</span><strong className="text-slate-900">{titleDisplay}</strong></div>
                                        <div><span className="text-slate-400 block font-semibold">Department</span><strong className="text-slate-900">{deptDisplay}</strong></div>
                                        <div><span className="text-slate-400 block font-semibold">Employee Type</span><strong className="text-slate-900">Full Time</strong></div>
                                        <div><span className="text-slate-400 block font-semibold">Date of Joining</span><strong className="text-slate-900">15 Aug 2023</strong></div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'compensation' && (
                                <div className="space-y-3 text-xs">
                                    <h3 className="font-extrabold text-slate-900 text-sm">Compensation & Salary</h3>
                                    <p className="text-slate-600">View structured compensation details in the Payroll module.</p>
                                    <Button onClick={() => navigate('/payroll')} className="bg-[#0052FF] text-white font-bold text-xs h-9 px-4 rounded-xl">
                                        Open Payroll Module
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'bank' && (
                                <div className="space-y-3 text-xs">
                                    <h3 className="font-extrabold text-slate-900 text-sm">Bank & Tax Details</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div><span className="text-slate-400 block font-semibold">Bank Name</span><strong className="text-slate-900">HDFC Bank Ltd</strong></div>
                                        <div><span className="text-slate-400 block font-semibold">Account Number</span><strong className="text-slate-900 font-mono">•••• •••• 9842</strong></div>
                                        <div><span className="text-slate-400 block font-semibold">IFSC Code</span><strong className="text-slate-900 font-mono">HDFC0001234</strong></div>
                                        <div><span className="text-slate-400 block font-semibold">PAN Number</span><strong className="text-slate-900 font-mono">ABCDE1234F</strong></div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-3 text-xs">
                                    <h3 className="font-extrabold text-slate-900 text-sm">My Documents</h3>
                                    <p className="text-slate-600">Access contracts, resumes, and identification files.</p>
                                    <Button onClick={() => navigate('/documents')} className="bg-[#0052FF] text-white font-bold text-xs h-9 px-4 rounded-xl">
                                        Open Documents Portal
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Account & Security Cards (4 cols) */}
                <div className="lg:col-span-4 space-y-5">
                    
                    {/* Card 1: Account & Security */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-sm">Account & Security</h3>

                        <div className="space-y-3 text-xs">
                            {/* Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <KeyRound className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold text-slate-700">Password</span>
                                </div>
                                <button
                                    onClick={() => navigate('/change-password')}
                                    className="text-[#0052FF] border border-[#0052FF]/30 hover:bg-blue-50 font-bold px-3 py-1 rounded-xl text-[11px]"
                                >
                                    Change Password
                                </button>
                            </div>

                            {/* Email Notifications */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold text-slate-700">Email Notifications</span>
                                </div>
                                <button
                                    onClick={() => setEmailModalOpen(true)}
                                    className="text-[#0052FF] hover:underline font-bold text-[11px]"
                                >
                                    Manage
                                </button>
                            </div>

                            {/* Two-Factor Authentication */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold text-slate-700">Two-Factor Authentication</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setTwoFactorEnabled(!twoFactorEnabled);
                                        showToast(`Two-Factor Authentication ${!twoFactorEnabled ? 'Enabled' : 'Disabled'}`);
                                    }}
                                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                                        twoFactorEnabled ? 'bg-[#0052FF]' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                                        twoFactorEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>

                            {/* Login Devices */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <Smartphone className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold text-slate-700">Login Devices</span>
                                </div>
                                <button
                                    onClick={() => setDevicesModalOpen(true)}
                                    className="text-[#0052FF] border border-[#0052FF]/30 hover:bg-blue-50 font-bold px-3 py-1 rounded-xl text-[11px]"
                                >
                                    View Devices
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Linked Accounts */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-sm">Linked Accounts</h3>

                        <div className="space-y-3 text-xs">
                            {/* Google */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2.5">
                                    <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 font-bold flex items-center justify-center text-[10px]">G</div>
                                    <div>
                                        <span className="font-bold text-slate-900 block leading-tight">Google</span>
                                        <span className="text-[10px] text-slate-400 font-medium">kaaysha.rao@gmail.com</span>
                                    </div>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center">
                                    <Check className="w-3 h-3 mr-0.5" /> Connected
                                </span>
                            </div>

                            {/* Microsoft */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="flex items-center space-x-2.5">
                                    <div className="w-6 h-6 rounded-full bg-blue-50 text-[#0052FF] font-bold flex items-center justify-center text-[10px]">M</div>
                                    <div>
                                        <span className="font-bold text-slate-900 block leading-tight">Microsoft</span>
                                        <span className="text-[10px] text-slate-400 font-medium">kaaysha.rao@outlook.com</span>
                                    </div>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center">
                                    <Check className="w-3 h-3 mr-0.5" /> Connected
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Card 3: Email Preferences */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-slate-900 text-sm">Email Preferences</h3>
                            <button 
                                onClick={() => setEmailModalOpen(true)}
                                className="text-[#0052FF] font-bold text-xs hover:underline"
                            >
                                Manage
                            </button>
                        </div>
                        <p className="text-slate-500 text-xs font-medium">Choose what emails you want to receive</p>

                        <div className="pt-2 flex justify-end">
                            <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100">
                                <Mail className="w-6 h-6 text-[#0052FF]" />
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

            {/* View Devices Modal */}
            {devicesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-sm">Active Login Sessions</h3>
                            <button onClick={() => setDevicesModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <strong className="text-slate-900 block">Windows PC — Chrome 122</strong>
                                    <span className="text-slate-400 font-mono">192.168.1.42 • Active Now</span>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Current</span>
                            </div>
                        </div>
                        <Button className="w-full bg-[#0052FF] text-white font-bold text-xs h-10 rounded-xl" onClick={() => setDevicesModalOpen(false)}>
                            Done
                        </Button>
                    </Card>
                </div>
            )}

            {/* Email Preferences Modal */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-sm">Email Preferences</h3>
                            <button onClick={() => setEmailModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs font-semibold text-slate-700">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" defaultChecked className="rounded text-[#0052FF]" />
                                <span>Leave Approval / Refusal Alerts</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" defaultChecked className="rounded text-[#0052FF]" />
                                <span>Monthly Payslip Generation Alerts</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" defaultChecked className="rounded text-[#0052FF]" />
                                <span>Company Announcements</span>
                            </label>
                        </div>
                        <Button className="w-full bg-[#0052FF] text-white font-bold text-xs h-10 rounded-xl" onClick={() => setEmailModalOpen(false)}>
                            Save Preferences
                        </Button>
                    </Card>
                </div>
            )}

        </div>
    );
}
