import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById, getMyProfile, updateEmployee, updateMyProfile, type Employee } from '@/services/employees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
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
  X,
  Calendar as CalendarIcon,
  Users,
  Heart,
  Globe,
  Settings
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
    const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'compensation' | 'bank' | 'documents'>('personal');
    
    // Edit Modes & Inputs
    const [editingField, setEditingField] = useState<'name' | 'phone' | 'address' | null>(null);
    const [editFullName, setEditFullName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');

    // Interactive ID Card Flip State (Flips ONLY when clicked)
    const [isIdCardFlipped, setIsIdCardFlipped] = useState(false);

    // Account & Security Interactive Controls
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [devicesModalOpen, setDevicesModalOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    // Toast Notifications
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

    // Save field updates to backend
    const handleSaveField = async (field: 'name' | 'phone' | 'address') => {
        if (!employee) return;
        try {
            let payload: any = {};
            if (field === 'name') {
                const parts = editFullName.trim().split(' ');
                const firstName = parts[0] || 'Employee';
                const lastName = parts.slice(1).join(' ') || 'Name';
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

    // Download My Data export
    const handleDownloadData = () => {
        if (!employee) return;
        const dataReport = {
            title: "Dayflow HRMS — Official Employee Data Export",
            export_timestamp: new Date().toISOString(),
            employee_code: employee.employee_code || "EMP00123",
            full_name: `${employee.first_name} ${employee.last_name}`,
            job_title: employee.job_title || "Software Engineer",
            department: employee.department_name || "Engineering",
            email: employee.email || "employee@dayflow.com",
            phone: employee.phone || "+91 98765 43210",
            address: employee.address || "Koramangala, Bengaluru, Karnataka - 560034",
            date_of_birth: (employee as any)?.date_of_birth || "20 Nov 2003",
            gender: (employee as any)?.gender || "Female",
            marital_status: (employee as any)?.marital_status || "Single",
            nationality: (employee as any)?.nationality || "Indian",
            employment_status: employee.employment_status || "ACTIVE",
            company: employee.company_name || "Dayflow Inc.",
            joining_date: employee.joining_date || "15 Aug 2023"
        };

        const blob = new Blob([JSON.stringify(dataReport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dayflow_${employee.first_name || 'Employee'}_${employee.employee_code || 'EMP00123'}_Data.json`;
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

    // Dynamic Database Values
    const nameDisplay = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee Profile';
    const codeDisplay = employee?.employee_code || 'EMP00123';
    const titleDisplay = employee?.job_title || 'Software Engineer';
    const emailDisplay = employee?.email || 'employee@dayflow.com';
    const phoneDisplay = employee?.phone || '+91 98765 43210';
    const addressDisplay = employee?.address || 'Koramangala, Bengaluru, Karnataka - 560034';
    const deptDisplay = employee?.department_name || 'Engineering';
    const dobDisplay = (employee as any)?.date_of_birth || '20 Nov 2003';
    const genderDisplay = (employee as any)?.gender || 'Female';
    const maritalDisplay = (employee as any)?.marital_status || 'Single';
    const nationalityDisplay = (employee as any)?.nationality || 'Indian';

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

                        {/* Button: "View ID Card" (Flips the card on click!) */}
                        <button
                            onClick={() => setIsIdCardFlipped(!isIdCardFlipped)}
                            className="mt-4 bg-white text-[#0052FF] hover:bg-blue-50 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2"
                        >
                            <CreditCard className="w-4 h-4 text-[#0052FF]" />
                            <span>View ID Card</span>
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
                            <div className="flex items-start space-x-2">
                                <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date of Birth</span>
                                    <span className="font-extrabold text-slate-900">{dobDisplay}</span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Gender</span>
                                    <span className="font-extrabold text-slate-900">{genderDisplay}</span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Heart className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Marital Status</span>
                                    <span className="font-extrabold text-slate-900">{maritalDisplay}</span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Nationality</span>
                                    <span className="font-extrabold text-slate-900">{nationalityDisplay}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive 3D Flip ID Card — click only, no hover flip */}
                        <div 
                            className="perspective-1000 cursor-pointer select-none"
                            onClick={() => setIsIdCardFlipped(!isIdCardFlipped)}
                            title="Click to flip ID Card"
                            style={{ perspective: '1000px' }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: '13rem',
                                    height: '21.5rem',
                                    transformStyle: 'preserve-3d',
                                    transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
                                    transform: isIdCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    borderRadius: '1rem',
                                }}
                            >
                                {/* ── FRONT ── */}
                                <div
                                    style={{
                                        position: 'absolute', inset: 0,
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        borderRadius: '1rem',
                                        overflow: 'hidden',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '1rem',
                                        gap: '0',
                                    }}
                                >
                                    {/* Logo header */}
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                                        <div style={{
                                            width: 26, height: 26,
                                            borderRadius: 7,
                                            background: '#0052FF',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, color: '#fff', fontSize: 12, flexShrink: 0,
                                        }}>{employee?.company_name ? employee.company_name.charAt(0).toUpperCase() : 'C'}</div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: 11, color: '#0f172a', lineHeight: 1.2 }}>{employee?.company_name || 'Company Name'}</div>
                                            <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>Employee ID Card</div>
                                        </div>
                                    </div>

                                    {/* Avatar */}
                                    <div style={{ textAlign:'center', marginBottom: 10 }}>
                                        <div style={{
                                            width: 64, height: 64,
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            margin: '0 auto 8px',
                                            border: '2px solid #f1f5f9',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                        }}>
                                            <img
                                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
                                                alt="Avatar"
                                                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                                            />
                                        </div>
                                        <div style={{ fontWeight: 900, fontSize: 11, color: '#0f172a', lineHeight: 1.3 }}>{nameDisplay}</div>
                                        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>{codeDisplay}</div>
                                        <div style={{ fontSize: 9, color: '#475569', fontWeight: 500, marginTop: 2 }}>{titleDisplay}</div>
                                    </div>

                                    {/* Divider + metadata */}
                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display:'flex', flexDirection:'column', gap: 5, flex: 1 }}>
                                        {[
                                            { label: 'Department',     value: deptDisplay },
                                            { label: 'Employee Type',  value: 'Full Time' },
                                            { label: 'DOJ',            value: '15 Aug 2023' },
                                        ].map(r => (
                                            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{r.label}</span>
                                                <span style={{ fontSize: 9, color: '#0f172a', fontWeight: 800 }}>{r.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Barcode + orange accent */}
                                    <div style={{ position:'relative', display:'flex', alignItems:'flex-end', marginTop: 8, paddingTop: 4 }}>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            fontSize: 12,
                                            letterSpacing: '-1px',
                                            color: '#0f172a',
                                            fontWeight: 900,
                                            transform: 'scaleY(1.4)',
                                            transformOrigin: 'bottom',
                                            lineHeight: 1,
                                        }}>
                                            ||||||||||||||||||||||||||||||||||||
                                        </div>
                                        {/* Orange curved corner */}
                                        <div style={{
                                            position: 'absolute',
                                            right: -16, bottom: -16,
                                            width: 44, height: 72,
                                            background: '#FF9500',
                                            borderTopLeftRadius: '100%',
                                            pointerEvents: 'none',
                                        }} />
                                    </div>
                                </div>

                                {/* ── BACK ── */}
                                <div
                                    style={{
                                        position: 'absolute', inset: 0,
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        borderRadius: '1rem',
                                        overflow: 'hidden',
                                        background: 'linear-gradient(135deg, #0052FF 0%, #0041cc 100%)',
                                        border: '1px solid #1e293b',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    {/* TOP HEADER BAND */}
                                    <div style={{
                                        background: 'rgba(0,0,0,0.1)',
                                        padding: '10px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '0.05em' }}>{(employee?.company_name || 'Company Name').toUpperCase()}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Employee ID Card</div>
                                        </div>
                                        <div style={{
                                            width: 26, height: 26, borderRadius: 7,
                                            background: 'rgba(255,255,255,0.15)',
                                            border: '1px solid rgba(255,255,255,0.25)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: 900, fontSize: 13,
                                        }}>{employee?.company_name ? employee.company_name.charAt(0).toUpperCase() : 'C'}</div>
                                    </div>

                                    {/* QR CODE SECTION */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 14px 8px' }}>
                                        {/* QR Box */}
                                        <div style={{
                                            background: '#fff',
                                            borderRadius: 10,
                                            padding: 9,
                                            boxShadow: '0 4px 20px rgba(0,82,255,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
                                            marginBottom: 8,
                                        }}>
                                            <QrCode style={{ width: 58, height: 58, color: '#0f172a' }} />
                                        </div>

                                        {/* Employee Code */}
                                        <div style={{
                                            color: '#fff', fontFamily: 'monospace', fontWeight: 900,
                                            fontSize: 10, letterSpacing: '0.15em', marginBottom: 3,
                                        }}>
                                            {codeDisplay}
                                        </div>
                                        <div style={{
                                            color: '#0052FF', fontSize: 7, fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.12em',
                                            background: 'rgba(0,82,255,0.12)',
                                            padding: '2px 8px', borderRadius: 20,
                                        }}>
                                            SCAN TO VERIFY IDENTITY
                                        </div>
                                    </div>

                                    {/* DIVIDER */}
                                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e40af, transparent)', margin: '0 14px' }} />

                                    {/* INFO ROWS */}
                                    <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        {[
                                            { icon: '🪪', label: 'Employee ID', value: codeDisplay },
                                            { icon: '📅', label: 'Date of Joining', value: employee?.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Aug 2023' },
                                            { icon: '🏢', label: 'Company', value: employee?.company_name || 'Company Name' },
                                        ].map(row => (
                                            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                                    <span style={{ fontSize: 9 }}>{row.icon}</span>
                                                    <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
                                                </div>
                                                <span style={{ fontSize: 8, color: '#f1f5f9', fontWeight: 800, fontFamily: 'monospace', textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AUTHORIZED FOOTER BAR */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #FF9500 0%, #e07c00 100%)',
                                        padding: '7px 14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    }}>
                                        <CheckCircle2 style={{ width: 11, height: 11, color: '#fff' }} />
                                        <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                                            Authorized Employee
                                        </span>
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
                                                <span className="text-xs font-bold text-slate-700">{genderDisplay}</span>
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
                                                    {isSelfProfile && (
                                                        <button 
                                                            onClick={() => setEditingField('phone')}
                                                            className="text-[#0052FF] hover:bg-blue-50 border border-[#0052FF]/30 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                            <span>Edit</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Marital Status (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Marital Status</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">{maritalDisplay}</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Date of Birth (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">{dobDisplay}</span>
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Nationality (READ-ONLY 🔒) */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nationality</label>
                                            <div className="flex items-center justify-between p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl">
                                                <span className="text-xs font-bold text-slate-700">{nationalityDisplay}</span>
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
                                    <Settings className="w-4 h-4 text-slate-400" />
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
                                        <span className="text-[10px] text-slate-400 font-medium">connected@gmail.com</span>
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
                                        <span className="text-[10px] text-slate-400 font-medium">connected@outlook.com</span>
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
