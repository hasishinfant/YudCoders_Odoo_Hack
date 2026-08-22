import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, UserCheck, ShieldCheck, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2, User, KeyRound } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { loginContext } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await login({ identifier: email, password });
            if (res.success) {
                loginContext(res.data.access_token, res.data.user);
                if (res.data.user.role === 'ADMIN') {
                    navigate('/employees');
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid email, Login ID, or password');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fill demo accounts for fast evaluation
    const handleQuickLogin = (demoEmail: string, demoPass: string) => {
        setEmail(demoEmail);
        setPassword(demoPass);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#F4F7FC] p-4 sm:p-6 lg:p-8 overflow-hidden font-sans">
            {/* Ambient Brand Light Blue Glows */}
            <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
                
                {/* Left Brand Panel */}
                <div className="lg:col-span-6 space-y-6 text-slate-900 text-center lg:text-left">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#0052FF] border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#0052FF]" />
                        <span>Dayflow Enterprise HRMS</span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                            Smart HR Suite for <br className="hidden sm:inline" />
                            <span className="text-[#0052FF]">
                                Modern Enterprise
                            </span>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
                            Manage shift attendance, leave requests, payroll payslips, employee documents, and RBAC governance in one portal.
                        </p>
                    </div>

                    {/* Quick Demo Credentials Buttons */}
                    <div className="pt-2 space-y-2">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Quick Demo Login Shortcuts</span>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-2 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin@dayflow.com', 'AdminPassword123!')}
                                className="bg-white hover:bg-blue-50 text-[#0052FF] border border-blue-200 px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-2xs transition-all hover:scale-105"
                            >
                                <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
                                <span>Fill Admin Demo</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('employee@dayflow.com', 'EmployeePassword123!')}
                                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-2xs transition-all hover:scale-105"
                            >
                                <UserCheck className="w-4 h-4 text-slate-600" />
                                <span>Fill Employee Demo</span>
                            </button>
                        </div>
                    </div>

                    {/* Feature Chips */}
                    <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-2.5 text-xs font-bold text-slate-600">
                        <span className="bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>JWT RBAC Security</span>
                        </span>
                        <span className="bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF]" />
                            <span>Odoo Wireframe Aligned</span>
                        </span>
                    </div>
                </div>

                {/* Right SaaS Login Card */}
                <div className="lg:col-span-6">
                    <Card className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl overflow-hidden p-2">
                        <CardHeader className="p-8 pb-6 border-b border-slate-100 space-y-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0052FF] to-blue-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/25">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Portal Sign In</CardTitle>
                                    <CardDescription className="text-slate-500 text-xs mt-0.5 font-medium">
                                        Enter your Work Email or System Login ID.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-2xl flex items-center text-xs font-bold animate-in fade-in">
                                    <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block" htmlFor="identifier">
                                    Work Email or Login ID
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                                    <Input 
                                        id="identifier" 
                                        type="text" 
                                        placeholder="e.g. admin@dayflow.com or OIJS0001" 
                                        required 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="pl-10 h-11 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-[#0052FF] focus:border-[#0052FF] font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block" htmlFor="password">
                                        Password
                                    </label>
                                    <Link to="/change-password" className="text-[11px] font-bold text-[#0052FF] hover:underline">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                                    <Input 
                                        id="password" 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="pl-10 pr-10 h-11 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-[#0052FF] focus:border-[#0052FF] font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full h-12 bg-[#0052FF] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <span>Authenticating Credentials...</span>
                                ) : (
                                    <>
                                        <span>Sign In to Portal</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>

                            <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                                <p className="text-[11px] text-slate-500 font-medium">
                                    Don't have an employee account?{' '}
                                    <Link to="/signup" className="font-bold text-[#0052FF] hover:underline">
                                        Account Registration Policy
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
