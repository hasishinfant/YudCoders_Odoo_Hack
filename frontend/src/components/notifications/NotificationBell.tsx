import { useState, useEffect, useRef } from 'react';
import {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    type NotificationItem
} from '@/services/notifications';
import { Bell, CheckCheck, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadNotifications = async () => {
        try {
            const res = await getMyNotifications({ limit: 10 });
            setNotifications(res.data || []);
            setUnreadCount(res.unread_count || 0);
        } catch (err) {
            console.error('Failed to load notifications', err);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id: number) => {
        try {
            await markNotificationRead(id);
            loadNotifications();
        } catch (err) {
            console.error('Failed to mark notification read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            loadNotifications();
        } catch (err) {
            console.error('Failed to mark all notifications read', err);
        }
    };

    const formatDate = (isoStr: string) => {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all focus:outline-none"
                title="Notifications"
            >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-sky-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-sky-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-sky-400" />
                            <span className="font-bold text-xs uppercase tracking-wider">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[11px] font-semibold text-slate-300 hover:text-sky-400 transition-colors flex items-center space-x-1"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 space-y-2">
                                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-bold text-slate-700 text-xs">You're all caught up!</p>
                                <p className="text-[11px] text-slate-400">No recent notifications to review.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-4 transition-colors flex items-start justify-between ${
                                        !n.read ? 'bg-sky-50/50 border-l-4 border-l-sky-500 font-semibold' : 'bg-white text-slate-600'
                                    }`}
                                >
                                    <div className="space-y-1 flex-1 pr-3">
                                        <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                                            <span>{n.title}</span>
                                            {!n.read && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                                        </div>
                                        <div className="text-slate-600 leading-snug text-[11px]">{n.message}</div>
                                        <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 pt-1">
                                            <Clock className="w-3 h-3 text-slate-300" />
                                            <span>{formatDate(n.created_at)}</span>
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <button
                                            onClick={() => handleMarkRead(n.id)}
                                            className="text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2 py-1 rounded text-[10px] font-bold shrink-0 mt-0.5 transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
