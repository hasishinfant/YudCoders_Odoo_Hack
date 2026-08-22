import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, ChevronRight, ChevronLeft, ChevronDown, Upload, X, Check,
    FileText, Mic, MicOff, Send, Save, Eye, MessageSquare, Phone, Ticket,
    AlertCircle, Info, Sun, Shield, Briefcase, Clock, Umbrella, RotateCcw,
    ArrowRight, Plus, Paperclip, Download, ExternalLink, RefreshCw, Filter,
    CheckCircle2, User, Building2, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;
type LeaveCategory = 'sick' | 'casual' | 'unpaid' | 'comp_off' | 'maternity' | 'emergency';
type ReasonCategory = 'medical' | 'personal' | 'family' | 'travel' | 'education' | 'other';
type HalfDaySlot = 'first_half' | 'second_half';

interface UploadedFile {
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'doc';
    status: 'uploaded';
}

// ─── Static data ─────────────────────────────────────────────────────────────
const LEAVE_TYPES: { id: LeaveCategory; label: string; icon: React.FC<any>; color: string; bg: string; balance: number; total: number; desc: string }[] = [
    { id: 'sick',      label: 'Sick Leave',      icon: Shield,    color: '#7C3AED', bg: '#EDE9FE', balance: 8,  total: 12, desc: 'For medical / health reasons' },
    { id: 'casual',    label: 'Casual Leave',    icon: Sun,       color: '#059669', bg: '#D1FAE5', balance: 12, total: 16, desc: 'For personal errands & events' },
    { id: 'comp_off',  label: 'Comp Off',        icon: RotateCcw, color: '#0052FF', bg: '#EFF6FF', balance: 3,  total: 5,  desc: 'Compensatory time off' },
    { id: 'unpaid',    label: 'Unpaid Leave',    icon: Briefcase, color: '#D97706', bg: '#FEF3C7', balance: 0,  total: 0,  desc: 'Leave without pay' },
    { id: 'maternity', label: 'Maternity Leave', icon: User,      color: '#DB2777', bg: '#FCE7F3', balance: 90, total: 90, desc: 'Maternity / paternity leave' },
    { id: 'emergency', label: 'Emergency Leave', icon: Zap,       color: '#DC2626', bg: '#FEE2E2', balance: 3,  total: 5,  desc: 'Urgent unplanned leave' },
];

const REASON_CATEGORIES: { id: ReasonCategory; label: string }[] = [
    { id: 'medical',   label: 'Medical / Health'  },
    { id: 'personal',  label: 'Personal Work'     },
    { id: 'family',    label: 'Family Emergency'  },
    { id: 'travel',    label: 'Travel'            },
    { id: 'education', label: 'Education / Exam'  },
    { id: 'other',     label: 'Other'             },
];

const BALANCE_CARDS = [
    { id: 'sick',     label: 'Sick Leave',   used: 4,  total: 12, left: 8,  color: '#7C3AED', bg: '#EDE9FE' },
    { id: 'casual',   label: 'Casual Leave', used: 4,  total: 16, left: 12, color: '#059669', bg: '#D1FAE5' },
    { id: 'comp',     label: 'Comp Off',     used: 2,  total: 5,  left: 3,  color: '#0052FF', bg: '#EFF6FF' },
    { id: 'unpaid',   label: 'Unpaid Leave', used: 0,  total: 0,  left: 0,  color: '#D97706', bg: '#FEF3C7' },
];

const UPCOMING_LEAVES = [
    { month: 'MAY', day: '24', dateRange: '24 – 26 May, 2025', type: 'Sick Leave',    days: 3, status: 'approved' },
    { month: 'JUN', day: '10', dateRange: '10 – 10 Jun, 2025', type: 'Casual Leave',  days: 1, status: 'pending'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
}
function formatDate(d: Date) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function calcWorkingDays(from: Date | null, to: Date | null): number {
    if (!from || !to) return 0;
    let count = 0;
    const cur = new Date(from);
    while (cur <= to) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Mini date-picker calendar ────────────────────────────────────────────────
function MiniCalendar({ value, value2, onSelect, rangeMode }: {
    value: Date | null; value2: Date | null;
    onSelect: (d: Date) => void; rangeMode: boolean;
}) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth); // Sun=0
    // shift to Mon=0
    const offset = (firstDay + 6) % 7;
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);

    const isSame = (a: Date | null, d: number) =>
        a && a.getFullYear() === viewYear && a.getMonth() === viewMonth && a.getDate() === d;
    const isInRange = (d: number) => {
        if (!value || !value2 || !rangeMode) return false;
        const dt = new Date(viewYear, viewMonth, d);
        const lo = value < value2 ? value : value2;
        const hi = value < value2 ? value2 : value;
        return dt > lo && dt < hi;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72 select-none">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); } else setViewMonth(m => m - 1); }}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-slate-800">{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); } else setViewMonth(m => m + 1); }}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const isStart = isSame(value, day);
                    const isEnd   = isSame(value2, day);
                    const inRange = isInRange(day);
                    const dt = new Date(viewYear, viewMonth, day);
                    const isPast = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    return (
                        <button key={i} disabled={isPast}
                            type="button"
                            onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
                            className={[
                                'h-8 w-full rounded-lg text-xs font-semibold transition-all',
                                isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50',
                                (isStart || isEnd) ? 'bg-[#0052FF] text-white hover:bg-blue-700' : '',
                                inRange ? 'bg-blue-50 text-[#0052FF]' : '',
                                (!isStart && !isEnd && !inRange) ? 'text-slate-700' : '',
                            ].join(' ')}>
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
    const steps = [
        { n: 1, label: 'Leave Type',      sub: 'Select type'     },
        { n: 2, label: 'Dates',           sub: 'Choose duration' },
        { n: 3, label: 'Reason & Documents', sub: 'Provide details' },
        { n: 4, label: 'Review & Submit', sub: 'Confirm & send'  },
    ];
    return (
        <div className="flex items-start gap-0">
            {steps.map((s, i) => {
                const done    = current > s.n;
                const active  = current === s.n;
                return (
                    <div key={s.n} className="flex items-center">
                        <div className="flex items-start gap-2">
                            <div className={[
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5',
                                done   ? 'bg-[#0052FF] text-white'              : '',
                                active ? 'bg-[#0052FF] text-white ring-4 ring-blue-100' : '',
                                !done && !active ? 'bg-slate-100 text-slate-400' : '',
                            ].join(' ')}>
                                {done ? <Check className="w-4 h-4" /> : s.n}
                            </div>
                            <div>
                                <div className={`text-xs font-bold ${active ? 'text-[#0052FF]' : done ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</div>
                                <div className="text-[10px] text-slate-400">{s.sub}</div>
                            </div>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-0.5 w-12 mx-3 mt-4 rounded-full ${done ? 'bg-[#0052FF]' : 'bg-slate-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Progress bar helper ──────────────────────────────────────────────────────
function BalanceBar({ pct, color }: { pct: number; color: string }) {
    return (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TimeOffPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Step
    const [step, setStep]               = useState<Step>(1);

    // Step 1 — Leave Type
    const [leaveType, setLeaveType]     = useState<LeaveCategory | null>(null);

    // Step 2 — Dates
    const [dateMode, setDateMode]       = useState<'range' | 'single' | 'half'>('range');
    const [startDate, setStartDate]     = useState<Date | null>(null);
    const [endDate, setEndDate]         = useState<Date | null>(null);
    const [halfSlot, setHalfSlot]       = useState<HalfDaySlot>('first_half');
    const [calPicking, setCalPicking]   = useState<'start' | 'end' | null>(null);

    // Step 3 — Reason
    const [reasonCat, setReasonCat]     = useState<ReasonCategory>('medical');
    const [reason, setReason]           = useState('I am not feeling well and need time for rest and medical check-up.');
    const [remarks, setRemarks]         = useState('');
    const [reasonDropOpen, setReasonDropOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
        { id: '1', name: 'Medical Certificate.pdf', size: '1.2 MB', type: 'pdf',   status: 'uploaded' },
        { id: '2', name: 'Prescription.jpg',        size: '890 KB',  type: 'image', status: 'uploaded' },
        { id: '3', name: 'Lab Report.docx',         size: '1.0 MB', type: 'doc',   status: 'uploaded' },
    ]);
    const [dragOver, setDragOver]       = useState(false);
    const fileRef                       = useRef<HTMLInputElement>(null);

    // Step 4
    const [submitted, setSubmitted]     = useState(false);
    const [savedDraft, setSavedDraft]   = useState(false);

    // Misc UI
    const [policyModal, setPolicyModal] = useState(false);
    const [helpModal, setHelpModal]     = useState(false);

    // Voice waveform animation
    const [wavePhase, setWavePhase]     = useState(0);
    useEffect(() => {
        if (!isListening) return;
        const t = setInterval(() => setWavePhase(p => p + 1), 80);
        return () => clearInterval(t);
    }, [isListening]);

    // Derived
    const workingDays = calcWorkingDays(startDate, dateMode === 'half' ? startDate : endDate);
    const typeInfo    = LEAVE_TYPES.find(t => t.id === leaveType);

    // ── File handling ──
    const addFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const icons: Record<string, 'pdf' | 'image' | 'doc'> = {
            'application/pdf': 'pdf',
            'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image',
        };
        Array.from(files).forEach(f => {
            const type = icons[f.type] || 'doc';
            const size = f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
            setUploadedFiles(prev => [...prev, { id: Date.now() + f.name, name: f.name, size, type, status: 'uploaded' }]);
        });
    }, []);

    // ── Step navigation ──
    const canAdvance = () => {
        if (step === 1) return !!leaveType;
        if (step === 2) return !!startDate && (dateMode === 'single' || dateMode === 'half' || !!endDate);
        if (step === 3) return reason.trim().length >= 10;
        return true;
    };

    // ── Handle date selection ──
    const handleDateSelect = (d: Date) => {
        if (dateMode === 'single' || dateMode === 'half') {
            setStartDate(d); setEndDate(null); setCalPicking(null);
        } else if (calPicking === 'start') {
            setStartDate(d); setEndDate(null); setCalPicking('end');
        } else if (calPicking === 'end') {
            if (startDate && d < startDate) { setStartDate(d); setCalPicking('end'); }
            else { setEndDate(d); setCalPicking(null); }
        }
    };

    // ── File icon ──
    const fileIconColor = (type: UploadedFile['type']) =>
        type === 'pdf' ? '#EF4444' : type === 'image' ? '#3B82F6' : '#F59E0B';
    const fileIcon = (type: UploadedFile['type']) =>
        type === 'pdf' ? '📄' : type === 'image' ? '🖼️' : '📋';

    // ── Waveform bars ──
    const BARS = 24;
    const waveHeights = Array.from({ length: BARS }, (_, i) =>
        isListening ? 4 + Math.abs(Math.sin((wavePhase + i) * 0.5)) * 22 : 4
    );

    // ─────────────────── RIGHT SIDEBAR ───────────────────────────────────────
    const RightSidebar = () => (
        <div className="space-y-5">
            {/* Leave Request Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 text-sm">Leave Request Timeline</h3>
                    <button className="flex items-center gap-1 text-[#0052FF] text-xs font-bold hover:underline">
                        <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                </div>
                <div className="space-y-4">
                    {/* Submitted */}
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0052FF] flex items-center justify-center shrink-0 shadow-sm">
                            <Send className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-slate-900">Submitted</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">10 May 2025, 10:30 AM</div>
                            <div className="text-[10px] text-slate-600 mt-1">Your request has been submitted successfully.</div>
                        </div>
                    </div>
                    {/* Manager Review */}
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-xs text-slate-900">Manager Review</div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">Pending</span>
                                    <Eye className="w-3 h-3 text-slate-400" />
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Waiting for your manager to review.</div>
                        </div>
                    </div>
                    {/* HR Review */}
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-xs text-slate-900">HR Review</div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">Pending</span>
                                    <Eye className="w-3 h-3 text-slate-400" />
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Request will be reviewed by HR.</div>
                        </div>
                    </div>
                    {/* Approval / Rejection */}
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Shield className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-xs text-slate-900">Approval / Rejection</div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">Pending</span>
                                    <Eye className="w-3 h-3 text-slate-400" />
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Final decision will be updated here.</div>
                        </div>
                    </div>
                    {/* Privacy */}
                    <div className="flex gap-2 pt-1 border-t border-slate-100 mt-1">
                        <Shield className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-snug">Names of reviewers are hidden for privacy. Click "View Details" to see.</p>
                    </div>
                </div>
            </div>

            {/* Leave Balance Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 text-sm">Leave Balance Summary</h3>
                    <button className="text-[#0052FF] text-xs font-bold hover:underline">View all</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {BALANCE_CARDS.map(b => (
                        <div key={b.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: b.bg }}>
                                    <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600">{b.label}</span>
                            </div>
                            {b.total === 0 ? (
                                <div className="text-[10px] text-slate-500">As per policy</div>
                            ) : (
                                <>
                                    <div className="font-black text-slate-900 text-sm">{String(b.left).padStart(2,'0')} <span className="text-[10px] text-slate-400 font-semibold">/ {b.total} days left</span></div>
                                    <BalanceBar pct={(b.used / b.total) * 100} color={b.color} />
                                    <div className="text-[9px] text-slate-400 mt-1">{b.used} days used</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Advisory */}
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] text-slate-700 font-semibold">You have 8 sick leave days available.</p>
                        <p className="text-[10px] text-slate-500">Taking leave from 10 – 11 May will use 2 working days.</p>
                        <button className="text-[#0052FF] text-[10px] font-bold mt-1 hover:underline flex items-center gap-1">View Policy <ArrowRight className="w-2.5 h-2.5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─────────────────── STEP 1: LEAVE TYPE ───────────────────────────────────
    const Step1 = () => (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-black text-slate-900">Select Leave Type</h2>
                <p className="text-xs text-slate-500 mt-1">Choose the type of leave you want to apply for.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {LEAVE_TYPES.map(lt => {
                    const Icon = lt.icon;
                    const sel  = leaveType === lt.id;
                    return (
                        <button key={lt.id} onClick={() => setLeaveType(lt.id)}
                            className={[
                                'text-left p-4 rounded-2xl border-2 transition-all group hover:shadow-md',
                                sel ? 'border-[#0052FF] bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:border-blue-200',
                            ].join(' ')}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: lt.bg }}>
                                    <Icon className="w-4.5 h-4.5" style={{ color: lt.color }} />
                                </div>
                                {sel && <CheckCircle2 className="w-5 h-5 text-[#0052FF]" />}
                            </div>
                            <div className={`font-bold text-sm ${sel ? 'text-[#0052FF]' : 'text-slate-800'}`}>{lt.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{lt.desc}</div>
                            {lt.total > 0 && (
                                <div className="mt-2 text-[10px] font-bold" style={{ color: lt.color }}>
                                    {lt.balance} / {lt.total} days left
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            {leaveType && typeInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                    <Info className="w-5 h-5 text-[#0052FF] shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-slate-800">You selected <span className="text-[#0052FF]">{typeInfo.label}</span></p>
                        <p className="text-xs text-slate-500">You have <strong>{typeInfo.balance} days</strong> available out of {typeInfo.total} total days.</p>
                    </div>
                </div>
            )}
        </div>
    );

    // ─────────────────── STEP 2: DATES ────────────────────────────────────────
    const Step2 = () => (
        <div>
            <div className="mb-5">
                <h2 className="text-lg font-black text-slate-900">Choose Leave Duration</h2>
                <p className="text-xs text-slate-500 mt-1">Select your leave start and end dates.</p>
            </div>

            {/* Mode selector */}
            <div className="flex gap-2 mb-5">
                {[['range','Date Range'],['single','Single Day'],['half','Half Day']] .map(([m,l]) => (
                    <button key={m} onClick={() => { setDateMode(m as any); setStartDate(null); setEndDate(null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${dateMode===m ? 'border-[#0052FF] bg-blue-50 text-[#0052FF]' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {dateMode === 'half' && (
                <div className="flex gap-2 mb-5">
                    {[['first_half','First Half (AM)'],['second_half','Second Half (PM)']].map(([s,l]) => (
                        <button key={s} onClick={() => setHalfSlot(s as HalfDaySlot)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${halfSlot===s ? 'border-[#0052FF] bg-blue-50 text-[#0052FF]' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {/* Start date */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">{dateMode === 'single' || dateMode === 'half' ? 'Date' : 'Start Date'} *</label>
                    <button onClick={() => setCalPicking(calPicking === 'start' ? null : 'start')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${calPicking === 'start' ? 'border-[#0052FF] bg-blue-50 text-[#0052FF]' : startDate ? 'border-slate-300 text-slate-800' : 'border-slate-200 text-slate-400'}`}>
                        <Calendar className="w-4 h-4" />
                        {startDate ? formatDate(startDate) : 'Select date'}
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                    {calPicking === 'start' && (
                        <MiniCalendar value={startDate} value2={endDate} rangeMode={dateMode === 'range'} onSelect={handleDateSelect} />
                    )}
                </div>

                {dateMode === 'range' && (
                    <>
                        <div className="flex items-end pb-2.5">
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600">End Date *</label>
                            <button onClick={() => setCalPicking(calPicking === 'end' ? null : 'end')}
                                disabled={!startDate}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${!startDate ? 'opacity-50 cursor-not-allowed border-slate-100 text-slate-300' : calPicking === 'end' ? 'border-[#0052FF] bg-blue-50 text-[#0052FF]' : endDate ? 'border-slate-300 text-slate-800' : 'border-slate-200 text-slate-400'}`}>
                                <Calendar className="w-4 h-4" />
                                {endDate ? formatDate(endDate) : 'Select date'}
                                <ChevronDown className="w-3.5 h-3.5 ml-1" />
                            </button>
                            {calPicking === 'end' && (
                                <MiniCalendar value={startDate} value2={endDate} rangeMode={true} onSelect={handleDateSelect} />
                            )}
                        </div>
                    </>
                )}
            </div>

            {startDate && (dateMode === 'single' || dateMode === 'half' || endDate) && (
                <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
                    <Clock className="w-5 h-5 text-[#0052FF] shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-slate-800">
                            {dateMode === 'half' ? `0.5 working day` : `${workingDays} working day${workingDays !== 1 ? 's' : ''}`}
                        </p>
                        <p className="text-xs text-slate-500">
                            {dateMode === 'range' && startDate && endDate
                                ? `${formatDate(startDate)} → ${formatDate(endDate)}`
                                : startDate ? formatDate(startDate) : ''}
                            {dateMode === 'half' ? ` · ${halfSlot === 'first_half' ? 'First Half (AM)' : 'Second Half (PM)'}` : ''}
                        </p>
                    </div>
                    {typeInfo && workingDays > typeInfo.balance && (
                        <div className="ml-auto flex items-center gap-1.5 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Exceeds balance</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // ─────────────────── STEP 3: REASON & DOCUMENTS ───────────────────────────
    const Step3 = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Reason */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-base font-black text-slate-900">Why are you taking leave?</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Help us understand the reason for your leave.</p>
                </div>

                {/* Reason category dropdown */}
                <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1.5">Select Reason Category</label>
                    <div className="relative">
                        <button onClick={() => setReasonDropOpen(o => !o)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-blue-300 transition-all">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                                    <Shield className="w-3 h-3 text-[#0052FF]" />
                                </div>
                                {REASON_CATEGORIES.find(r => r.id === reasonCat)?.label}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${reasonDropOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {reasonDropOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                {REASON_CATEGORIES.map(r => (
                                    <button key={r.id}
                                        onClick={() => { setReasonCat(r.id); setReasonDropOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 hover:text-[#0052FF] transition-colors ${reasonCat === r.id ? 'bg-blue-50 text-[#0052FF]' : 'text-slate-700'}`}>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed reason */}
                <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1.5">Detailed Reason <span className="text-red-500">*</span></label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value.slice(0, 250))}
                        rows={5}
                        placeholder="Describe the reason for your leave..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#0052FF] placeholder-slate-300"
                    />
                    <div className="text-right text-[10px] text-slate-400 -mt-1">{reason.length}/250</div>
                </div>

                {/* Remarks */}
                <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1.5">Remarks <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="Any additional remarks for HR/manager..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#0052FF] placeholder-slate-300"
                    />
                </div>

                {/* Voice input */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <p className="text-xs font-bold text-slate-700">Or describe your leave by voice <span className="text-slate-400 font-normal">(Optional)</span></p>
                            <p className="text-[10px] text-slate-400">Click the mic and speak. AI will fill the details for you.</p>
                        </div>
                    </div>
                    {/* Waveform */}
                    <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-end gap-0.5 flex-1 h-9">
                            {waveHeights.map((h, i) => (
                                <div key={i}
                                    className="flex-1 rounded-full transition-all duration-100"
                                    style={{
                                        height: `${h}px`,
                                        background: isListening
                                            ? `hsl(${220 + i * 3}, 80%, ${55 + (h / 28) * 20}%)`
                                            : '#CBD5E1',
                                    }}
                                />
                            ))}
                        </div>
                        <button onClick={() => setIsListening(l => !l)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all shrink-0 ${isListening ? 'bg-red-500 scale-110 shadow-red-200 shadow-lg' : 'bg-[#0052FF]'}`}>
                            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                        </button>
                    </div>
                    {isListening && (
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] font-bold text-slate-700 animate-pulse">Listening… Speak now</span>
                            <button onClick={() => setIsListening(false)} className="text-[10px] text-slate-500 hover:text-red-500 font-semibold">Cancel</button>
                        </div>
                    )}
                    {!isListening && (
                        <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                            <span>💡</span> Tip: Try saying "I need sick leave for two days from tomorrow"
                        </p>
                    )}
                </div>
            </div>

            {/* Right — Documents */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-base font-black text-slate-900">Supporting Documents <span className="text-slate-400 font-normal text-sm">(if any)</span></h2>
                    <p className="text-xs text-slate-500 mt-0.5">Upload files to support your leave request.</p>
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-[#0052FF] bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
                    onClick={() => fileRef.current?.click()}>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-5 h-5 text-[#0052FF]" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Drag &amp; drop files here</p>
                    <p className="text-xs text-slate-400 mt-1">or</p>
                    <button
                        onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                        className="mt-2 px-5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-all shadow-sm">
                        Browse Files
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2">Max file size: 10MB | Supported: PDF, JPG, PNG, DOCX</p>
                    <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden" onChange={e => addFiles(e.target.files)} />
                </div>

                {/* Uploaded files */}
                <div className="space-y-2">
                    {uploadedFiles.map(f => (
                        <div key={f.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-all group">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${fileIconColor(f.type)}15` }}>
                                {fileIcon(f.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">{f.name}</div>
                                <div className="text-[10px] text-slate-400">{f.size} · Uploaded</div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <button onClick={() => setUploadedFiles(files => files.filter(u => u.id !== f.id))}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-all shrink-0">
                                <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ─────────────────── STEP 4: REVIEW & SUBMIT ──────────────────────────────
    const Step4 = () => {
        if (submitted) return (
            <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Leave Request Submitted!</h2>
                <p className="text-sm text-slate-500 mt-2">Your request has been sent for review. You'll be notified once approved.</p>
                <div className="flex justify-center gap-3 mt-6">
                    <button onClick={() => { setStep(1); setSubmitted(false); setLeaveType(null); setStartDate(null); setEndDate(null); setReason(''); }}
                        className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Apply Another
                    </button>
                    <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-[#0052FF] text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
        const typeInfo2 = LEAVE_TYPES.find(t => t.id === leaveType);
        return (
            <div className="space-y-5">
                <div>
                    <h2 className="text-lg font-black text-slate-900">Review &amp; Submit</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Please review all details before submitting.</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    {[
                        { label: 'Leave Type',    value: typeInfo2?.label || '—' },
                        { label: 'Duration',      value: startDate ? (endDate ? `${formatDate(startDate)} → ${formatDate(endDate)}` : formatDate(startDate)) : '—' },
                        { label: 'Working Days',  value: dateMode === 'half' ? '0.5 days' : `${workingDays} day${workingDays !== 1 ? 's' : ''}` },
                        { label: 'Reason',        value: reason || '—' },
                        { label: 'Category',      value: REASON_CATEGORIES.find(r => r.id === reasonCat)?.label || '—' },
                        { label: 'Remarks',       value: remarks || '—' },
                        { label: 'Documents',     value: uploadedFiles.length ? `${uploadedFiles.length} file(s) attached` : 'None' },
                    ].map((row, i) => (
                        <div key={row.label} className={`flex gap-4 px-5 py-3.5 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                            <span className="text-xs font-bold text-slate-500 w-32 shrink-0">{row.label}</span>
                            <span className="text-xs font-semibold text-slate-800">{row.value}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">By submitting, you confirm that the information provided is accurate. This request will go through the approval workflow before being finalized.</p>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => setSubmitted(true)}
                        className="px-8 py-3 bg-[#0052FF] text-white rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all hover:scale-105">
                        <Send className="w-4 h-4" />
                        Submit Leave Request
                    </button>
                </div>
            </div>
        );
    };

    // ─────────────────── BOTTOM: UPCOMING LEAVE + NEED HELP ───────────────────
    const BottomSection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {/* Upcoming Leave */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 text-sm">Upcoming Leave</h3>
                    <button className="text-[#0052FF] text-xs font-bold hover:underline flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> View Calendar
                    </button>
                </div>
                <div className="space-y-3">
                    {UPCOMING_LEAVES.map(ul => (
                        <div key={ul.day} className="flex items-center gap-3">
                            <div className="text-center bg-slate-50 rounded-xl p-2 w-12 shrink-0 border border-slate-100">
                                <div className="text-[9px] font-black text-[#0052FF] uppercase tracking-wider">{ul.month}</div>
                                <div className="text-lg font-black text-slate-800 leading-none">{ul.day}</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-800">{ul.dateRange}</div>
                                <div className="text-[10px] text-slate-500">{ul.type}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 block">{ul.days} {ul.days === 1 ? 'Day' : 'Days'}</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${ul.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {ul.status.charAt(0).toUpperCase() + ul.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Need Help */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-slate-900 text-sm">Need Help?</h3>
                </div>
                <p className="text-[10px] text-slate-400 mb-4">Our HR team is here to help you.</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                        { icon: MessageSquare, label: 'Chat with HR',   action: () => setHelpModal(true) },
                        { icon: Phone,         label: 'Call HR Team',   action: () => window.open('tel:+911800000000') },
                        { icon: Ticket,        label: 'Raise a Ticket', action: () => setHelpModal(true) },
                    ].map(item => {
                        const Icon = item.icon;
                        return (
                            <button key={item.label} onClick={item.action}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-[#0052FF] hover:bg-blue-50 transition-all group">
                                <Icon className="w-5 h-5 text-slate-400 group-hover:text-[#0052FF] transition-colors" />
                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#0052FF] text-center leading-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-0.5 bg-slate-100" />
                    <p className="text-[10px] text-slate-400 shrink-0">Average response time: 2h 15m</p>
                    <div className="flex-1 h-0.5 bg-slate-100" />
                </div>
                {/* Illustration */}
                <div className="flex justify-end mt-2">
                    <div className="w-20 h-16 relative">
                        <div className="absolute bottom-0 right-0 w-16 h-16 bg-amber-100 rounded-full opacity-60" />
                        <Umbrella className="absolute bottom-2 right-2 w-10 h-10 text-amber-500" />
                    </div>
                </div>
            </div>
        </div>
    );

    // ─────────────────── POLICY MODAL ─────────────────────────────────────────
    const PolicyModal = () => policyModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPolicyModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 text-lg">Leave Policy</h3>
                    <button onClick={() => setPolicyModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                    {[
                        'Employees accrue 1.5 days of paid leave per month.',
                        'Sick leave requires a medical certificate for absences > 2 days.',
                        'Leave requests must be submitted at least 2 business days in advance.',
                        'Comp Off must be availed within 30 days of the extra day worked.',
                        'Unpaid leave is granted at manager and HR discretion.',
                    ].map((p, i) => (
                        <div key={i} className="flex gap-3">
                            <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                            <p>{p}</p>
                        </div>
                    ))}
                </div>
                <button onClick={() => setPolicyModal(false)} className="mt-6 w-full py-2.5 bg-[#0052FF] text-white rounded-xl font-bold text-sm hover:bg-blue-700">Close</button>
            </div>
        </div>
    ) : null;

    const HelpModalEl = () => helpModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHelpModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 text-lg">Contact HR Support</h3>
                    <button onClick={() => setHelpModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Phone className="w-5 h-5 text-[#0052FF]" />
                        <div><div className="font-bold text-slate-800">HR Helpline</div><div className="text-xs text-slate-500">1800-000-0000 (Mon–Fri, 9AM–6PM)</div></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-emerald-500" />
                        <div><div className="font-bold text-slate-800">Live Chat</div><div className="text-xs text-slate-500">hr@dayflow.in · Average response: 2h 15m</div></div>
                    </div>
                </div>
                <button onClick={() => setHelpModal(false)} className="mt-6 w-full py-2.5 bg-[#0052FF] text-white rounded-xl font-bold text-sm hover:bg-blue-700">Got it</button>
            </div>
        </div>
    ) : null;

    // ─────────────────── RENDER ───────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F4F7FC] p-6">
            <PolicyModal />
            <HelpModalEl />

            {/* ── Page Header ── */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Apply Leave</h1>
                    <p className="text-xs text-slate-500 mt-1">Submit your leave request and track its status in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setPolicyModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-[#0052FF] shadow-sm transition-all">
                        <FileText className="w-3.5 h-3.5" /> Leave Policy
                    </button>
                    <button onClick={() => setSavedDraft(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${savedDraft ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#0052FF] text-white border-[#0052FF] hover:bg-blue-700'}`}>
                        {savedDraft ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Draft</>}
                    </button>
                </div>
            </div>

            {/* ── 3-column layout ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Main card */}
                <div className="xl:col-span-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Step bar */}
                        <div className="px-6 py-5 border-b border-slate-100 overflow-x-auto">
                            <StepBar current={step} />
                        </div>

                        {/* Step content */}
                        <div className="px-6 py-6">
                            {step === 1 && <Step1 />}
                            {step === 2 && <Step2 />}
                            {step === 3 && <Step3 />}
                            {step === 4 && <Step4 />}
                        </div>

                        {/* Navigation footer */}
                        {!submitted && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <button
                                    onClick={() => step > 1 && setStep(s => (s - 1) as Step)}
                                    disabled={step === 1}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold transition-all ${step === 1 ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-700 hover:bg-slate-100'}`}>
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <span className="text-xs text-slate-400 hidden sm:block">You can save draft or continue later.</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSavedDraft(true)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all">
                                        Save Draft
                                    </button>
                                    {step < 4 ? (
                                        <button
                                            onClick={() => canAdvance() && setStep(s => (s + 1) as Step)}
                                            disabled={!canAdvance()}
                                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${canAdvance() ? 'bg-[#0052FF] text-white hover:bg-blue-700 shadow-md shadow-blue-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                            {step === 3 ? 'Review & Submit' : 'Continue'}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>

                    <BottomSection />
                </div>

                {/* Right sidebar */}
                <div className="xl:col-span-4">
                    <RightSidebar />
                </div>
            </div>
        </div>
    );
}
