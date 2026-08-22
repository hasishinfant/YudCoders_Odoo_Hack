import api from './api';

export interface AttendanceRecord {
    id: number;
    employee_id: number;
    date: string;
    check_in?: string;
    check_out?: string;
    worked_hours?: number;
    extra_hours?: number;
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
    created_at: string;
    updated_at: string;
    employee_name?: string;
    employee_code?: string;
    department_name?: string;
}

export const checkIn = async () => {
    const response = await api.post('/attendance/check-in');
    return response.data;
};

export const checkOut = async () => {
    const response = await api.post('/attendance/check-out');
    return response.data;
};

export const getTodayAttendance = async () => {
    const response = await api.get('/attendance/today');
    return response.data;
};

export const getMyAttendance = async (params?: { start_date?: string; end_date?: string; skip?: number; limit?: number }) => {
    const response = await api.get('/attendance/me', { params });
    return response.data;
};

export const getAdminAttendance = async (params?: {
    q?: string;
    employee_id?: number;
    department_id?: number;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    skip?: number;
    limit?: number;
}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
};

export const getAttendanceById = async (id: number) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
};
