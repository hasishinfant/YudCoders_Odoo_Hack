import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Bell, Search, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    type NotificationItem
} from '@/services/notifications';

export default function AnnouncementsPage() {
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
                        Notifications & Announcements
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Stay updated with HR alerts, leave approvals, payroll updates, and company-wide notices.
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
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse">
                            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                            <div className="h-3 bg-slate-100 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                    <CardContent className="p-12 text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                        <p className="font-semibold text-sm text-red-600">{error}</p>
                        <button
                            onClick={loadNotifications}
                            className="text-xs font-bold text-[#0052FF] hover:underline"
                        >
                            Try again
                        </button>
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm">
                    <CardContent className="p-12 text-center text-slate-500 space-y-2">
                        <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-sm">
                            {notifications.length === 0
                                ? 'No notifications yet'
                                : 'No notifications match your search'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {notifications.length === 0
                                ? 'System notifications such as leave approvals and payroll updates will appear here.'
                                : 'Try adjusting your search or filter.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(n => (
                        <Card
                            key={n.id}
                            onClick={() => !n.read && handleMarkRead(n.id)}
                            className={`transition-all border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-md ${
                                !n.read
                                    ? 'bg-blue-50/30 border-l-4 border-l-[#0052FF] cursor-pointer'
                                    : 'bg-white cursor-default'
                            }`}
                        >
                            <CardContent className="p-5 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                                            !n.read ? 'bg-[#0052FF]/10 text-[#0052FF]' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                <h3 className="font-bold text-sm text-slate-900 leading-snug">{n.title}</h3>
                                                {!n.read && (
                                                    <span className="w-2 h-2 rounded-full bg-[#0052FF] shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="text-[10px] text-slate-400 font-semibold block whitespace-nowrap">
                                            {formatDate(n.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {!n.read && (
                                    <div className="flex justify-end pt-1">
                                        <span className="text-[10px] text-[#0052FF] flex items-center gap-1 font-bold">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Click to mark as read
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
