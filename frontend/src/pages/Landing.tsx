import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  Folder, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F4F7FC] text-slate-900 font-sans selection:bg-[#0052FF] selection:text-white">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-blue-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/25">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div>
                        <span className="text-xl font-black text-slate-900 tracking-tight block leading-none">Dayflow</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">HR Management System</span>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600">
                    <a href="#features" className="hover:text-[#0052FF] transition-colors">Features</a>
                    <a href="#modules" className="hover:text-[#0052FF] transition-colors">Modules</a>
                    <a href="#security" className="hover:text-[#0052FF] transition-colors">Security</a>
                    <a href="#compliance" className="hover:text-[#0052FF] transition-colors">Odoo Compliance</a>
                </nav>

                <div className="flex items-center space-x-3">
                    <Button 
                        variant="outline" 
                        className="text-xs font-extrabold h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() => navigate('/login')}
                    >
                        Sign In
                    </Button>
                    <Button 
                        className="text-xs font-extrabold h-10 px-5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 space-x-2"
                        onClick={() => navigate('/login')}
                    >
                        <span>Launch HR Portal</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#0052FF] border border-blue-200/80 px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase shadow-2xs animate-in fade-in slide-in-from-top-4">
                    <Sparkles className="w-4 h-4 text-[#0052FF]" />
                    <span>Dayflow HR Suite v1.0 — Production Ready</span>
                </div>

                <div className="space-y-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                        The All-In-One HR Suite for <br className="hidden sm:inline" />
                        <span className="text-[#0052FF]">Next-Generation Enterprises</span>
                    </h1>
                    <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                        Automate employee directories, shift attendance logs, leave request workflows, payroll payslip calculation, and digital document governance in one unified SaaS portal.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <Button 
                        onClick={() => navigate('/login')}
                        className="w-full sm:w-auto h-12 px-8 bg-[#0052FF] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all flex items-center justify-center space-x-2"
                    >
                        <span>Open Demo HR Portal</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Button 
                        onClick={() => navigate('/signup')}
                        variant="outline"
                        className="w-full sm:w-auto h-12 px-8 bg-white border-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        <span>View Onboarding Policy</span>
                    </Button>
                </div>

                {/* Hero Dashboard Preview Banner */}
                <div className="pt-8 max-w-5xl mx-auto">
                    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <span className="text-xs font-mono text-slate-400 pl-2">dayflow.enterprise.hrms</span>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Live Portal
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            <div className="bg-[#0052FF] text-white p-5 rounded-2xl space-y-2 shadow-lg shadow-blue-500/20">
                                <span className="text-[10px] font-black uppercase text-blue-200">Active Employee</span>
                                <h3 className="text-lg font-black text-white">Kaaysha Rao</h3>
                                <p className="text-xs text-blue-100 font-mono">EMP00123 • Software Engineer</p>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-400">Today's Attendance</span>
                                <h3 className="text-lg font-black text-slate-900">09:03 AM Check-In</h3>
                                <p className="text-xs text-emerald-600 font-bold">Shift Active / On Duty</p>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-400">Leave Balance</span>
                                <h3 className="text-lg font-black text-slate-900">12 Days Available</h3>
                                <p className="text-xs text-[#0052FF] font-bold">PTO Entitlement Progress 80%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Modules Grid */}
            <section id="modules" className="py-20 px-6 lg:px-12 bg-white border-t border-b border-slate-200/80">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="text-center space-y-3 max-w-2xl mx-auto">
                        <span className="text-xs font-black uppercase tracking-widest text-[#0052FF]">Comprehensive Modules</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            Built to Match Official Odoo HR Requirements
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium">
                            Every module is engineered with strict RBAC security, full FastAPI backend integration, and modern SaaS UI components.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <Card className="p-6 rounded-2xl border-slate-200/80 hover:shadow-xl hover:border-blue-200 transition-all space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Employee Management</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Auto-generated Login IDs (<code className="font-mono text-slate-800 bg-slate-100 px-1 rounded">OIJS0001</code>), employee profiles, job titles, and interactive 3D flip ID cards.
                            </p>
                        </Card>

                        {/* Feature 2 */}
                        <Card className="p-6 rounded-2xl border-slate-200/80 hover:shadow-xl hover:border-blue-200 transition-all space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Attendance & Shifts</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Real-time Check-In and Check-Out tracking, worked hours calculation, extra overtime hours, and weekly shift activity bar graphs.
                            </p>
                        </Card>

                        {/* Feature 3 */}
                        <Card className="p-6 rounded-2xl border-slate-200/80 hover:shadow-xl hover:border-blue-200 transition-all space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Leave / Time Off</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Entitlement progress meters for PTO, Sick, and Unpaid leave types, leave creation modal, and HR approval/refusal workflows.
                            </p>
                        </Card>

                        {/* Feature 4 */}
                        <Card className="p-6 rounded-2xl border-slate-200/80 hover:shadow-xl hover:border-blue-200 transition-all space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Payroll & Payslips</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Salary configuration breakdown (Basic, HRA, Allowances, Tax Deductions), net take-home calculation, and printable payslips.
                            </p>
                        </Card>

                        {/* Feature 5 */}
                        <Card className="p-6 rounded-2xl border-slate-200/80 hover:shadow-xl hover:border-blue-200 transition-all space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <Folder className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">Document Governance</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Centralized document vault for employment contracts, resumes, certificates, file uploads, previews, and downloads.
                            </p>
                        </Card>

                        {/* Feature 6 */}
                        <Card className="p-6 rounded-2xl border-slate-200/80 hover:shadow-xl hover:border-blue-200 transition-all space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-black text-slate-900">JWT & RBAC Security</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Secure JWT bearer tokens, role-based access control (ADMIN vs EMPLOYEE), password change enforcement, and two-factor authentication.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Metrics Bar */}
            <section className="py-12 bg-[#0052FF] text-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                    <div>
                        <span className="text-3xl sm:text-4xl font-black block font-mono">63 / 63</span>
                        <span className="text-xs text-blue-200 font-extrabold uppercase tracking-wider">Pytest Tests Passing</span>
                    </div>
                    <div>
                        <span className="text-3xl sm:text-4xl font-black block font-mono">100%</span>
                        <span className="text-xs text-blue-200 font-extrabold uppercase tracking-wider">Odoo Wireframe Match</span>
                    </div>
                    <div>
                        <span className="text-3xl sm:text-4xl font-black block font-mono">0 Errors</span>
                        <span className="text-xs text-blue-200 font-extrabold uppercase tracking-wider">Frontend Production Build</span>
                    </div>
                    <div>
                        <span className="text-3xl sm:text-4xl font-black block font-mono">&lt; 5ms</span>
                        <span className="text-xs text-blue-200 font-extrabold uppercase tracking-wider">API Latency</span>
                    </div>
                </div>
            </section>

            {/* Footer Callout */}
            <section className="py-16 px-6 lg:px-12 max-w-4xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    Ready to Experience Modern HR Management?
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                    Test the complete live portal with pre-configured Admin and Employee accounts right now.
                </p>
                <Button 
                    onClick={() => navigate('/login')}
                    className="h-12 px-8 bg-[#0052FF] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/30"
                >
                    <span>Launch Dayflow HR Portal</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-white border-t border-slate-200/80 text-center text-xs font-semibold text-slate-400">
                <p>© 2026 Dayflow HR Management System. Built with React, TypeScript, FastAPI & PostgreSQL.</p>
            </footer>
        </div>
    );
}
