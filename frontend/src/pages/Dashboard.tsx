import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHealth } from '@/services/api';

export default function Dashboard() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealth();
      setHealthStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-500">Overview of the Dayflow platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Backend API Connection</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Checking status...</p>
            ) : error ? (
              <div className="space-y-2">
                <Badge variant="destructive">Offline</Badge>
                <p className="text-sm text-red-500">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchHealth}>Retry</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
                <p className="text-sm text-slate-600">{healthStatus?.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
