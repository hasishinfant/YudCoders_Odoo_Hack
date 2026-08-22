import { Card, CardContent } from '@/components/ui/card';
import { type LeaveBalance } from '@/services/leave';
import { Calendar, DollarSign } from 'lucide-react';

interface LeaveBalanceCardProps {
    balance: LeaveBalance;
}

export default function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
    const percentage = Math.min(100, Math.round((balance.remaining_days / (balance.max_days || 1)) * 100));

    return (
        <Card className="bg-white border-sky-100/80 shadow-sm hover:shadow-md hover:border-sky-200 transition-all rounded-2xl overflow-hidden group">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            balance.paid ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                            {balance.paid ? <DollarSign className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">{balance.leave_type_name}</h3>
                            <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                balance.paid ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {balance.paid ? 'Paid Time Off' : 'Unpaid Leave'}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 font-mono block leading-none">{balance.remaining_days}</span>
                        <span className="text-[11px] text-slate-400 font-bold">/ {balance.max_days} days left</span>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                percentage > 50 ? 'bg-gradient-to-r from-sky-400 to-blue-600' : percentage > 20 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-bold">
                        <span>Used: {balance.used_days} days</span>
                        <span className="text-sky-700">Available: {balance.remaining_days} days</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
