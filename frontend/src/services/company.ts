import api from './api';

export interface Announcement {
    id: number;
    title: string;
    summary: string;
    date: string;
    tag: string;
    tag_color: string;
    created_at: string;
}

export interface AnnouncementCreate {
    title: string;
    summary: string;
    date: string;
    tag?: string;
    tag_color?: string;
}

export interface Holiday {
    id: number;
    name: string;
    date: string;
    type: string;
    created_at: string;
}

export interface HolidayCreate {
    name: string;
    date: string;
    type?: string;
}

// Announcements Api
export const getAnnouncements = async () => {
    return api.get<Announcement[]>('/announcements');
};

export const createAnnouncement = async (data: AnnouncementCreate) => {
    return api.post<Announcement>('/announcements', data);
};

export const deleteAnnouncement = async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/announcements/${id}`);
};

// Holidays Api
export const getHolidays = async () => {
    return api.get<Holiday[]>('/holidays');
};

export const createHoliday = async (data: HolidayCreate) => {
    return api.post<Holiday>('/holidays', data);
};

export const deleteHoliday = async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/holidays/${id}`);
};

// System Settings Api
export const getMailSettings = async () => {
    return api.get<{ success: boolean; data: { smtp_email: string; smtp_password: string } }>('/settings/mail');
};

export const updateMailSettings = async (data: { smtp_email: string; smtp_password: string }) => {
    return api.post<{ success: boolean; message: string }>('/settings/mail', data);
};
