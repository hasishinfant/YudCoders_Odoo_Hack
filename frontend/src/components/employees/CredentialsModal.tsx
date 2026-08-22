import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { EmployeeCreateResponse } from '@/services/employees';

interface CredentialsModalProps {
    data: EmployeeCreateResponse;
    onClose: () => void;
}

export default function CredentialsModal({ data, onClose }: CredentialsModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const fullCredentialsText = `DAYFLOW HRMS CREDENTIALS
Employee: ${data.first_name} ${data.last_name}
Login ID: ${data.login_id}
Email: ${data.email}
Initial Password: ${data.initial_password}
Portal URL: ${window.location.origin}/login`;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
                <CardHeader className="space-y-1">
                    <div className="flex items-center space-x-2 text-emerald-600">
                        <ShieldCheck className="w-6 h-6" />
                        <CardTitle className="text-xl font-bold">Employee Account Provisioned</CardTitle>
                    </div>
                    <CardDescription className="text-slate-600">
                        Initial login credentials generated for <span className="font-semibold text-slate-900">{data.first_name} {data.last_name}</span>.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start space-x-3 text-amber-800 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                            <span className="font-semibold block">Important Warning</span>
                            Save these credentials securely. The initial password will not be displayed again.
                        </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Employee Name</span>
                            <span className="font-semibold text-slate-800">{data.first_name} {data.last_name}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Email</span>
                            <span className="font-mono text-slate-800">{data.email}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Generated Login ID</span>
                                <span className="text-base font-mono font-bold text-slate-900">{data.login_id}</span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs space-x-1"
                                onClick={() => copyToClipboard(data.login_id, 'login_id')}
                            >
                                {copiedField === 'login_id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedField === 'login_id' ? 'Copied' : 'Copy ID'}</span>
                            </Button>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Initial Password</span>
                                <span className="text-base font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{data.initial_password}</span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs space-x-1"
                                onClick={() => copyToClipboard(data.initial_password, 'password')}
                            >
                                {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedField === 'password' ? 'Copied' : 'Copy Password'}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between border-t pt-4">
                    <Button 
                        variant="outline"
                        className="w-full sm:w-auto text-slate-700"
                        onClick={() => copyToClipboard(fullCredentialsText, 'all')}
                    >
                        {copiedField === 'all' ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copiedField === 'all' ? 'All Credentials Copied' : 'Copy All Credentials'}
                    </Button>
                    
                    <Button 
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800"
                        onClick={onClose}
                    >
                        Done & Close
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
