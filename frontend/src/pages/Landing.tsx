import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Clock, Calendar, DollarSign, Folder, ShieldCheck, 
  ArrowRight, CheckCircle2, BarChart3, Building2, Zap,
  Globe, Lock, Bell, FileText, Star, ChevronRight, Sparkles
} from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    const features = [
        { icon: Clock, title: 'Smart Attendance', desc: 'Biometric check-in/out with real-time shift tracking, overtime calculation, and attendance heatmaps.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { icon: Calendar, title: 'Leave Management', desc: 'Multi-tier approval workflows, leave balance tracking, calendar view, and policy-based accrual engine.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        { icon: DollarSign, title: 'Payroll Engine', desc: 'Automated salary computation, tax deductions, payslip generation with PDF export and bank transfer integration.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { icon: Users, title: 'Employee Directory', desc: 'Centralized employee profiles with department mapping, role management, digital ID cards, and org chart.', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { icon: BarChart3, title: 'HR Analytics', desc: 'Executive dashboards with headcount trends, attrition analysis, payroll expenditure, and leave utilization reports.', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        { icon: Folder, title: 'Document Vault', desc: 'Secure cloud document storage, version history, category tagging, and quick download for all employee docs.', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    ];

    const stats = [
        { value: '10K+', label: 'Employees Managed' },
        { value: '99.9%', label: 'Uptime SLA' },
        { value: '50+', label: 'HR Modules' },
        { value: '<2s', label: 'Avg Response Time' },
    ];

    const testimonials = [
        { name: 'Priya Sharma', role: 'CHRO, Infovision Ltd.', text: 'Dayflow transformed our HR ops. Leave approvals that took days now happen in minutes. Our team loves the clean UI.' },
        { name: 'Arjun Mehta', role: 'HR Manager, TechCorp India', text: 'The payroll engine is incredibly accurate. Zero calculation errors in 8 months. The payslip download feature alone saved us hours.' },
        { name: 'Riya Nair', role: 'People Ops, StartupHub', text: 'Finally an HRMS that doesn\'t feel like a 2010 enterprise app. Dayflow is fast, beautiful and everything just works.' },
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#0052FF] selection:text-white overflow-x-hidden">

            {/* ── NAVBAR ── */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-16 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052FF] to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div>
                        <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">Dayflow</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">HRMS Platform</span>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center space-x-7 text-[13px] font-semibold text-slate-600">
                    <a href="#features" className="hover:text-[#0052FF] transition-colors">Features</a>
                    <a href="#stats" className="hover:text-[#0052FF] transition-colors">Why Dayflow</a>
                    <a href="#testimonials" className="hover:text-[#0052FF] transition-colors">Testimonials</a>
                    <a href="#security" className="hover:text-[#0052FF] transition-colors">Security</a>
                </nav>

                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/login')} className="hidden sm:block text-[13px] font-bold text-slate-700 hover:text-[#0052FF] transition-colors px-3 py-2">
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-[13px] font-bold h-9 px-5 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                    >
                        Launch Portal
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </header>

            {/* ── HERO ── */}
            <section className="relative px-6 lg:px-16 pt-20 pb-28 overflow-hidden">
                {/* Background gradient mesh */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
                    <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto">
                    {/* Badge */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#0052FF] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            Enterprise-Grade HR Platform
                            <span className="bg-[#0052FF] text-white text-[9px] px-2 py-0.5 rounded-full font-black">NEW</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                        The Modern HRMS<br />
                        <span className="text-[#0052FF]">Built for India's</span>{' '}
                        <span className="relative">
                            Growing Teams
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            </svg>
                        </span>
                    </h1>

                    <p className="text-center text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                        Automate attendance, leaves, payroll, and compliance in one beautifully designed platform. Trusted by HR teams across 500+ companies in India.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-sm font-black h-12 px-8 rounded-2xl bg-[#0052FF] hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-105 w-full sm:w-auto justify-center"
                        >
                            <Zap className="w-4 h-4" />
                            Start Free — Launch HR Portal
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-sm font-bold h-12 px-7 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 transition-all hover:bg-slate-50 w-full sm:w-auto justify-center"
                        >
                            <Users className="w-4 h-4 text-slate-400" />
                            Admin Demo Login
                        </button>
                    </div>

                    {/* Trust bar */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
                        {['No credit card required', 'SOC 2 Compliant', 'GDPR Ready', '24/7 Support'].map(t => (
                            <span key={t} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS BAND ── */}
            <section id="stats" className="bg-[#0052FF] py-12 px-6 lg:px-16">
                <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map(s => (
                        <div key={s.label} className="text-center">
                            <div className="text-3xl sm:text-4xl font-black text-white mb-1">{s.value}</div>
                            <div className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES GRID ── */}
            <section id="features" className="py-24 px-6 lg:px-16 bg-slate-50/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4">
                            <Building2 className="w-3 h-3" />
                            Core HR Modules
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                            Everything your HR team needs.<br />
                            <span className="text-[#0052FF]">All in one place.</span>
                        </h2>
                        <p className="text-slate-500 text-sm max-w-lg mx-auto">
                            From hiring to offboarding — Dayflow covers the complete employee lifecycle with powerful automation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className={`bg-white rounded-2xl p-6 border ${f.border} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
                                    <div className={`w-11 h-11 rounded-2xl ${f.bg} ${f.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-5 h-5 ${f.color}`} />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-base mb-2">{f.title}</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                                    <div className={`mt-4 flex items-center gap-1 text-xs font-bold ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        Learn more <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── PORTAL PREVIEW CARDS ── */}
            <section className="py-24 px-6 lg:px-16 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                            Two portals. One platform.
                        </h2>
                        <p className="text-slate-500 text-sm max-w-lg mx-auto">Role-based access ensures every user sees exactly what they need — nothing more, nothing less.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employee Portal Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer" onClick={() => navigate('/login')}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-8 -mb-8" />
                            <div className="relative">
                                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-5">
                                    <Users className="w-3 h-3" /> Employee Portal
                                </div>
                                <h3 className="text-2xl font-black mb-3">For Your Workforce</h3>
                                <p className="text-blue-200 text-sm leading-relaxed mb-5">Self-service HR tools employees actually enjoy using. Check-in, apply leave, download payslips — all in 3 clicks.</p>
                                <ul className="space-y-2 mb-6">
                                    {['Daily attendance & shift tracking', 'Leave application & balance view', 'Payslip download & salary history', 'Digital ID card & profile'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-xs text-blue-100">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <button className="flex items-center gap-2 bg-white text-blue-700 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                                    Employee Login <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Admin Portal Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-900/40 transition-all duration-300 cursor-pointer" onClick={() => navigate('/login')}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-700/30 rounded-full -ml-8 -mb-8" />
                            <div className="relative">
                                <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-5">
                                    <ShieldCheck className="w-3 h-3" /> HR / Admin Portal
                                </div>
                                <h3 className="text-2xl font-black mb-3">For HR Leaders</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-5">Command center for your HR department. Approve leave, process payroll, generate reports and manage your entire workforce.</p>
                                <ul className="space-y-2 mb-6">
                                    {['Full employee directory & org chart', 'Leave approval & policy management', 'Payroll generation & bulk processing', 'HR analytics & compliance reports'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-2.5 rounded-xl transition-colors">
                                    Admin Login <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SECURITY SECTION ── */}
            <section id="security" className="py-20 px-6 lg:px-16 bg-slate-50">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-5">
                                    <Lock className="w-3 h-3" />
                                    Enterprise Security
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                                    Bank-grade security for<br />your most sensitive HR data.
                                </h2>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    Every piece of data in Dayflow is encrypted at rest and in transit. Role-based access control ensures employees only see what they're authorized to view.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: Lock, label: 'AES-256 Encryption' },
                                        { icon: ShieldCheck, label: 'SOC 2 Type II' },
                                        { icon: Globe, label: 'GDPR Compliant' },
                                        { icon: Users, label: 'RBAC Access Control' },
                                    ].map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.label} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { icon: Bell, title: 'Real-time Audit Logs', desc: 'Every action is logged with user, timestamp, and IP for compliance.' },
                                    { icon: FileText, title: 'Document Encryption', desc: 'All uploaded HR documents are encrypted using AES-256-GCM.' },
                                    { icon: Lock, title: 'JWT Authentication', desc: 'Secure token-based authentication with automatic expiry and refresh.' },
                                ].map(item => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.title} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 text-sm">{item.title}</div>
                                                <div className="text-slate-500 text-xs mt-0.5">{item.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section id="testimonials" className="py-24 px-6 lg:px-16 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Loved by HR teams across India</h2>
                        <p className="text-slate-500 text-sm">Don't take our word for it — here's what our customers say.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {testimonials.map((t) => (
                            <div key={t.name} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052FF] to-blue-700 flex items-center justify-center text-white font-black text-sm">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-xs">{t.name}</div>
                                        <div className="text-slate-400 text-[10px]">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BOTTOM CTA ── */}
            <section className="py-20 px-6 lg:px-16 bg-[#0052FF]">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to modernize your HR?</h2>
                    <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
                        Join thousands of growing companies using Dayflow to automate their HR processes and give employees a delightful experience.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center gap-2 bg-white text-[#0052FF] font-black text-sm h-12 px-8 rounded-2xl hover:bg-blue-50 transition-all hover:scale-105 shadow-xl"
                        >
                            <Zap className="w-4 h-4" />
                            Launch HR Portal Now
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 text-white font-black text-sm h-12 px-7 rounded-2xl hover:bg-white/10 transition-all"
                        >
                            View Admin Demo
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-slate-900 px-6 lg:px-16 py-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0052FF] to-blue-700 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span className="text-white font-black text-sm">Dayflow HRMS</span>
                    </div>
                    <p className="text-slate-500 text-xs text-center">
                        © {new Date().getFullYear()} Dayflow Inc. · Built with ❤️ for modern HR teams · All rights reserved.
                    </p>
                    <div className="flex items-center gap-5 text-slate-500 text-xs font-semibold">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
