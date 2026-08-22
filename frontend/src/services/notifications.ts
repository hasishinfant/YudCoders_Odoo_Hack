import api from './api';

export interface NotificationItem {
    id: number;
    user_id: number;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    updated_at: string;
}

export const getMyNotifications = async (params?: { unread_only?: boolean; skip?: number; limit?: number }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
};

export const getUnreadNotificationCount = async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
};

export const markNotificationRead = async (id: number) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
};
