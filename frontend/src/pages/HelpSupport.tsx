import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HelpCircle, Phone, Mail, FileText, ChevronDown, Send, Check } from 'lucide-react';

interface FaqItem {
    q: string;
    a: string;
    cat: string;
}

export default function HelpSupportPage() {
    const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const faqs: FaqItem[] = [
        {
            cat: 'Leave & Attendance',
            q: 'How do I request compensatory off (Comp Off)?',
            a: 'You can apply for Comp Off directly from the "Leave Requests" page under "Request Time Off". Select "Comp Off" as the type, input the days, and detail the extra working days. It will go to your manager for approval.'
        },
        {
            cat: 'Leave & Attendance',
            q: 'How are my working hours calculated?',
            a: 'Working hours are recorded based on your web check-in and check-out events. The system calculates working duration, excluding a standard 1-hour break time.'
        },
        {
            cat: 'Payroll & Tax',
            q: 'Where can I download my monthly payslips?',
            a: 'Payslips can be downloaded from the "Payroll" module in the sidebar. Click on "Download Payslip" next to the respective salary entry.'
        },
        {
            cat: 'Portal Account',
            q: 'How do I update my phone number or emergency contacts?',
            a: 'Go to "My Profile" and click "Edit" on the phone number or address section. Alternatively, navigate to "Settings" to request HR-administered personal details updates.'
        }
    ];

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setSubject('');
            setMessage('');
            alert('HR Support Ticket raised successfully! Our team will get back to you shortly.');
        }, 1200);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="border-b border-slate-200/80 pb-5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Help &amp; Support</h1>
                <p className="text-xs text-slate-500 mt-1">Get support from the HR operations team, read portal guides, or browse FAQs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* FAQ and Contact Methods (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* FAQs */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                <HelpCircle className="w-5 h-5 text-[#0052FF]" />
                                <span>Frequently Asked Questions</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-slate-100 p-0">
                            {faqs.map((faq, i) => (
                                <div key={i} className="p-4 pl-6 pr-6">
                                    <button
                                        onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                                        className="w-full flex items-center justify-between text-left focus:outline-none"
                                    >
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase text-[#0052FF] bg-blue-50 px-2 py-0.5 rounded-full">
                                                {faq.cat}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-800 leading-snug">{faq.q}</h4>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpenIndex === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    {faqOpenIndex === i && (
                                        <p className="text-xs text-slate-500 mt-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {faq.a}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Support Ticket Form */}
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900 flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-orange-500" />
                                <span>Raise a Support Ticket</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 block">Subject *</label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
                                        placeholder="e.g. Issue downloading Form 16 payslip"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 block">Message Details *</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] resize-none"
                                        placeholder="Provide complete details about your concern..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitted}
                                    className="px-5 py-2.5 bg-[#0052FF] hover:bg-blue-700 disabled:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center space-x-1.5"
                                >
                                    {submitted ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Submit Support Request</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Direct Contact Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-900">Direct Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center border border-blue-100">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Support</span>
                                    <a href="mailto:hr@dayflow.in" className="text-xs font-bold text-slate-800 hover:text-[#0052FF]">
                                        hr@dayflow.in
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Helpline</span>
                                    <a href="tel:+911800000000" className="text-xs font-bold text-slate-800 hover:text-orange-600">
                                        +91 1800-000-0000
                                    </a>
                                </div>
                            </div>

                            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-2">
                                <div className="font-bold text-slate-900">Service Hours</div>
                                <p>Monday to Friday: 9:00 AM – 6:00 PM IST</p>
                                <p className="text-[10px] text-slate-400 italic">Average reply time for email requests: 2 hours.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
