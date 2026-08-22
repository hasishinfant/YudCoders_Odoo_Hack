import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, Bell, Globe, Lock, Check, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMailSettings, updateMailSettings } from '@/services/company';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const { user } = useAuth();
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(false);
    const [twoFactor, setTwoFactor] = useState(true);
    const [language, setLanguage] = useState('en');
    const [saved, setSaved] = useState(false);
    
    // SMTP states
    const [smtpEmail, setSmtpEmail] = useState('');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [smtpLoading, setSmtpLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            const loadSmtp = async () => {
                try {
                    const res = await getMailSettings();
                    if (res.data?.success) {
                        setSmtpEmail(res.data.data.smtp_email);
                        setSmtpPassword(res.data.data.smtp_password);
                    }
                } catch (err) {
                    console.error('Failed to load SMTP settings', err);
                }
            };
            loadSmtp();
        }
    }, [user]);

    const handleSave = async () => {
        setSmtpLoading(true);
        try {
            if (user?.role === 'ADMIN') {
                await updateMailSettings({
                    smtp_email: smtpEmail,
                    smtp_password: smtpPassword
                });
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setSmtpLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-5 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portal Settings</h1>
                    <p className="text-xs text-slate-500 mt-1">Configure language, application preferences, notifications, and login credentials.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={smtpLoading}
                    className="px-5 py-2.5 bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center space-x-1.5 self-start sm:self-auto disabled:opacity-50"
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            <span>Saved Preferences!</span>
                        </>
                    ) : (
                        <span>Save Settings</span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Preferences Columns */}
                <div className="lg:col-span-8 space-y-6">
                    {/* General Settings */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                <Globe className="w-5 h-5 text-[#0052FF]" />
                                <span>General Preferences</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Language</h4>
                                    <p className="text-[10px] text-slate-400">Select application primary display language.</p>
                                </div>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="h-9 px-3 py-1 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                                >
                                    <option value="en">English (India)</option>
                                    <option value="hi">Hindi</option>
                                    <option value="mr">Marathi</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Date Format</h4>
                                    <p className="text-[10px] text-slate-400">Configure default format for portal lists and reports.</p>
                                </div>
                                <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                                    DD MMM YYYY
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Preferences */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                <Bell className="w-5 h-5 text-orange-500" />
                                <span>Notification Preferences</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Email Notifications</h4>
                                    <p className="text-[10px] text-slate-400">Receive copy of payslips, leaves status, and announcements.</p>
                                </div>
                                <button
                                    onClick={() => setEmailNotif(!emailNotif)}
                                    className={`w-11 h-6 rounded-full p-1 transition-all ${emailNotif ? 'bg-[#0052FF]' : 'bg-slate-200'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">SMS Alerts</h4>
                                    <p className="text-[10px] text-slate-400">Receive high-priority system alerts and check-in confirmation logs.</p>
                                </div>
                                <button
                                    onClick={() => setSmsNotif(!smsNotif)}
                                    className={`w-11 h-6 rounded-full p-1 transition-all ${smsNotif ? 'bg-[#0052FF]' : 'bg-slate-200'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${smsNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SMTP Configuration for Admin */}
                    {user?.role === 'ADMIN' && (
                        <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                    <Mail className="w-5 h-5 text-indigo-500" />
                                    <span>Mail Server Configuration (SMTP)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">SMTP Server Email</label>
                                    <Input
                                        type="email"
                                        placeholder="e.g. flipclip0008@gmail.com"
                                        value={smtpEmail}
                                        onChange={(e) => setSmtpEmail(e.target.value)}
                                        className="h-10 text-xs rounded-xl"
                                    />
                                    <p className="text-[10px] text-slate-400">Used as the sender address for company-wide notifications and announcements.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">SMTP App Password</label>
                                    <Input
                                        type="password"
                                        placeholder="e.g. csco ohor rehf jcqe"
                                        value={smtpPassword}
                                        onChange={(e) => setSmtpPassword(e.target.value)}
                                        className="h-10 text-xs rounded-xl"
                                    />
                                    <p className="text-[10px] text-slate-400">Your Google App Password or SMTP password (spaces will be automatically cleaned).</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Account Settings Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                <Shield className="w-5 h-5 text-slate-600" />
                                <span>Security Settings</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Two-Factor Auth</h4>
                                    <p className="text-[9px] text-slate-400">Require code during portal logins.</p>
                                </div>
                                <button
                                    onClick={() => setTwoFactor(!twoFactor)}
                                    className={`w-11 h-6 rounded-full p-1 transition-all ${twoFactor ? 'bg-[#0052FF]' : 'bg-slate-200'}`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${twoFactor ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => window.location.href = '/change-password'}
                                    className="w-full flex items-center justify-center space-x-2 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all"
                                >
                                    <Lock className="w-4 h-4 text-slate-400" />
                                    <span>Change Password</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
