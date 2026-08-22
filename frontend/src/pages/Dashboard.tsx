import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHealth } from '@/services/api';
import { getTodayAttendance, type AttendanceRecord } from '@/services/attendance';
import TodayAttendanceCard from '@/components/attendance/TodayAttendanceCard';

export default function Dashboard() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, attData] = await Promise.all([
        getHealth(),
        getTodayAttendance().catch(() => ({ data: null }))
      ]);
      setHealthStatus(healthData);
      setTodayAttendance(attData?.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500 text-sm">Welcome to Dayflow HRMS.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Widget */}
        <TodayAttendanceCard 
          attendance={todayAttendance} 
          onUpdate={fetchDashboardData} 
        />

        {/* System Health */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">System Status</CardTitle>
            <CardDescription>Backend API Connection</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Checking status...</p>
            ) : error ? (
              <div className="space-y-2">
                <Badge variant="destructive">Offline</Badge>
                <p className="text-sm text-red-500">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchDashboardData}>Retry</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge className="bg-emerald-500 hover:bg-emerald-600">Online</Badge>
                <p className="text-xs font-mono text-slate-600">{healthStatus?.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
