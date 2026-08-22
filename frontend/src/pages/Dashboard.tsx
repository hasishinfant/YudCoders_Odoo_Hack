import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodayAttendance, type AttendanceRecord } from '@/services/attendance';
import { getMyLeaveBalances, getMyLeaveRequests, type LeaveBalance, type LeaveRequest } from '@/services/leave';
import { getMySalary, type EmployeeSalary } from '@/services/payroll';
import TodayAttendanceCard from '@/components/attendance/TodayAttendanceCard';
import { Calendar, ArrowRight, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [mySalary, setMySalary] = useState<EmployeeSalary | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [attData, balData, reqData, salData] = await Promise.all([
        getTodayAttendance().catch(() => ({ data: null })),
        getMyLeaveBalances().catch(() => ({ data: [] })),
        getMyLeaveRequests().catch(() => ({ data: [] })),
        getMySalary().catch(() => ({ data: null }))
      ]);
      setTodayAttendance(attData?.data || null);
      setLeaveBalances(balData?.data || []);
      setPendingLeaves((reqData?.data || []).filter((r: LeaveRequest) => r.status === 'PENDING'));
      setMySalary(salData?.data || null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val?: number) => {
    if (!val) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500 text-sm">Welcome to Dayflow HRMS.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Attendance Widget */}
        <div className="lg:col-span-2">
          <TodayAttendanceCard 
            attendance={todayAttendance} 
            onUpdate={fetchDashboardData} 
          />
        </div>

        {/* Time Off & Salary Summary Column */}
        <div className="space-y-6">
          {/* Salary Quick Summary */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>My Salary Summary</span>
              </CardTitle>
              <CardDescription className="text-xs">Current Compensation Structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Net Take-Home</span>
                <span className="text-sm font-mono font-bold text-emerald-600">{formatCurrency(mySalary?.net_salary)}</span>
              </div>
              <Link 
                to="/payroll"
                className="inline-flex items-center justify-center w-full mt-1 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors space-x-1"
              >
                <span>View Payslips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Time Off Widget */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Time Off Summary</span>
                </CardTitle>
                {pendingLeaves.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    {pendingLeaves.length} Pending
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">Your available leave days</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {leaveBalances.slice(0, 2).map(b => (
                <div key={b.leave_type_id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">{b.leave_type_name}</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{b.remaining_days} / {b.max_days} days</span>
                </div>
              ))}

              <Link 
                to="/time-off"
                className="inline-flex items-center justify-center w-full mt-1 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors space-x-1"
              >
                <span>Manage Time Off</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
