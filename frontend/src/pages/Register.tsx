import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Info, ArrowLeft, ArrowRight, Building, KeyRound } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#F4F7FC] p-4 sm:p-6 lg:p-8 font-sans overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-2xl z-10 space-y-6">
                <Card className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl overflow-hidden p-2">
                    <CardHeader className="p-8 pb-6 border-b border-slate-100 space-y-3 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-blue-500 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-blue-500/25 shrink-0">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Account Registration Policy</CardTitle>
                                <CardDescription className="text-slate-500 text-xs mt-1 font-medium">
                                    Official Employee Onboarding Guidance for Dayflow HRMS
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-6">
                        {/* Policy Notice Box */}
                        <div className="bg-blue-50/80 border border-blue-200/80 p-5 rounded-2xl space-y-2">
                            <div className="flex items-center space-x-2 text-[#0052FF] font-extrabold text-sm">
                                <Info className="w-5 h-5 shrink-0" />
                                <span>Normal Users Cannot Self-Register</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                Per official HR security policies and Odoo HRMS wireframe standards, public registration is strictly disabled. New employee accounts are provisioned exclusively by HR Officers or Administrators.
                            </p>
                        </div>

                        {/* Onboarding Workflow Steps */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">How Account Provisioning Works</h3>
                            
                            <div className="grid grid-cols-1 gap-3 text-xs">
                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start space-x-3">
                                    <Building className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-900 font-bold block">1. HR Provisioning</strong>
                                        <span className="text-slate-500 font-medium">HR Admin inputs employee information into the directory.</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start space-x-3">
                                    <KeyRound className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-900 font-bold block">2. Automatic Credentials Generation</strong>
                                        <span className="text-slate-500 font-medium">System generates a unique Login ID (e.g. <code className="bg-white px-1.5 py-0.5 rounded border text-slate-800 font-mono font-bold">OIJS0001</code>) and initial temporary password.</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start space-x-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-slate-900 font-bold block">3. First Login Password Security</strong>
                                        <span className="text-slate-500 font-medium">Upon first sign in using email or Login ID, the employee is required to set a permanent private password.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <Button 
                                variant="outline" 
                                className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-xs border-slate-200 text-slate-700"
                                onClick={() => navigate('/login')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                <span>Back to Login</span>
                            </Button>

                            <Button 
                                className="w-full sm:w-auto h-11 px-6 bg-[#0052FF] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25"
                                onClick={() => navigate('/login')}
                            >
                                <span>Sign In with Credentials</span>
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
