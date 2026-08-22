import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { changePassword } from '@/services/auth';
import { AlertCircle, Lock, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        try {
            const res = await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_new_password: confirmPassword
            });
            if (res.success) {
                logout();
                navigate('/login?message=password-changed');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'An error occurred while changing password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Ambient Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />

            <div className="w-full max-w-md z-10">
                <Card className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden text-white">
                    <CardHeader className="p-8 pb-6 border-b border-slate-800/80 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-white tracking-tight">Security Check Required</CardTitle>
                            <CardDescription className="text-slate-400 text-xs mt-1">
                                You are logging in for the first time. Update your auto-generated initial password to continue.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-2xl flex items-center text-xs font-bold animate-in fade-in zoom-in-95">
                                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block" htmlFor="current_password">
                                Initial Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                <Input 
                                    id="current_password" 
                                    type="password" 
                                    placeholder="Enter initial password"
                                    required 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="pl-10 h-11 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block" htmlFor="new_password">
                                New Password
                            </label>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                <Input 
                                    id="new_password" 
                                    type="password" 
                                    placeholder="At least 8 characters"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="pl-10 h-11 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block" htmlFor="confirm_password">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                <Input 
                                    id="confirm_password" 
                                    type="password" 
                                    placeholder="Re-enter new password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="pl-10 h-11 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 font-mono"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <span>Updating Account Security...</span>
                            ) : (
                                <>
                                    <span>Set New Password</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
