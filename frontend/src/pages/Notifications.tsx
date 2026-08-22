import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Search, RefreshCw, AlertCircle } from 'lucide-react';
import {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    type NotificationItem
} from '@/services/notifications';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const loadNotifications = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getMyNotifications({ limit: 50 });
            setNotifications(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleMarkRead = async (id: number) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch {
            /* silent */
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch {
            /* silent */
        } finally {
            setMarkingAll(false);
        }
    };

    const filtered = notifications.filter(n => {
        const matchesSearch =
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = !showUnreadOnly || !n.read;
        return matchesSearch && matchesFilter;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-5 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Bell className="w-6 h-6 text-[#0052FF]" />
                        Inbox & Notifications
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Stay updated with HR alerts, leave approvals, payroll updates, and system notifications.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={loadNotifications}
                        disabled={loading}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-all shadow-sm disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll || unreadCount === 0}
                        className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-40"
                    >
                        {markingAll ? 'Marking...' : 'Mark all as read'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative sm:col-span-2">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={`h-10 px-4 text-xs font-bold rounded-xl border transition-all ${
                        showUnreadOnly
                            ? 'bg-[#0052FF] text-white border-[#0052FF]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {showUnreadOnly ? `Showing Unread (${unreadCount})` : `All Notifications (${notifications.length})`}
                </button>
            </div>

            {/* Stats Bar */}
            {!loading && notifications.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold">
                        <span className="text-[#0052FF] font-black">{unreadCount}</span> unread
                    </span>
                    <span>·</span>
                    <span>{notifications.length} total notifications</span>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052FF]" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800 text-sm">All caught up!</p>
                    <p className="text-xs text-slate-400">No notifications match your current selection.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(n => (
                        <Card 
                            key={n.id} 
                            className={`border transition-all duration-200 rounded-2xl shadow-2xs ${
                                !n.read ? 'bg-blue-50/20 border-blue-150' : 'bg-white border-slate-200/80'
                            }`}
                        >
                            <CardContent className="p-4 sm:p-5 flex items-start gap-4 justify-between relative">
                                {!n.read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052FF] rounded-l-2xl" />
                                )}
                                <div className="space-y-1.5 flex-1 pr-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                            <span>{n.title}</span>
                                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" />}
                                        </h3>
                                        <span className="text-[10px] text-slate-400 font-bold font-mono">
                                            {formatDate(n.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                                </div>

                                {!n.read && (
                                    <button
                                        onClick={() => handleMarkRead(n.id)}
                                        className="text-[10px] font-black text-[#0052FF] hover:underline shrink-0 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
