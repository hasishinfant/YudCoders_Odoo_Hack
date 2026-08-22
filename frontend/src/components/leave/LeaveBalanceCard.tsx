import { Card, CardContent } from '@/components/ui/card';
import { type LeaveBalance } from '@/services/leave';
import { Calendar, DollarSign } from 'lucide-react';

interface LeaveBalanceCardProps {
    balance: LeaveBalance;
}

export default function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
    const percentage = Math.min(100, Math.round((balance.remaining_days / (balance.max_days || 1)) * 100));

    return (
        <Card className="bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-all overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            balance.paid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                            {balance.paid ? <DollarSign className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">{balance.leave_type_name}</h3>
                            <span className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                balance.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {balance.paid ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 font-mono block leading-none">{balance.remaining_days}</span>
                        <span className="text-[11px] text-slate-400 font-medium">/ {balance.max_days} days left</span>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                percentage > 50 ? 'bg-emerald-500' : percentage > 20 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                        <span>Used: {balance.used_days} days</span>
                        <span>Available: {balance.remaining_days} days</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
