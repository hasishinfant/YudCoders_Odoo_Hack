import api from './api';

export interface LeaveType {
    id: number;
    name: string;
    description?: string;
    paid: boolean;
    max_days: number;
    active: boolean;
    created_at: string;
}

export interface LeaveBalance {
    leave_type_id: number;
    leave_type_name: string;
    paid: boolean;
    max_days: number;
    used_days: number;
    remaining_days: number;
}

export interface LeaveRequest {
    id: number;
    employee_id: number;
    employee_name?: string;
    employee_code?: string;
    department_name?: string;
    leave_type_id: number;
    leave_type_name?: string;
    leave_type_paid?: boolean;
    start_date: string;
    end_date: string;
    duration_days: number;
    reason?: string;
    comment?: string;
    status: 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
    approver_id?: number;
    approver_name?: string;
    created_at: string;
    updated_at: string;
}

export const getLeaveTypes = async () => {
    const response = await api.get('/leave-types');
    return response.data;
};

export const createLeaveType = async (data: { name: string; description?: string; paid?: boolean; max_days?: number }) => {
    const response = await api.post('/leave-types', data);
    return response.data;
};

export const updateLeaveType = async (id: number, data: Partial<LeaveType>) => {
    const response = await api.patch(`/leave-types/${id}`, data);
    return response.data;
};

export const getMyLeaveRequests = async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get('/leave-requests/me', { params });
    return response.data;
};

export const getMyLeaveBalances = async () => {
    const response = await api.get('/leave-requests/balances');
    return response.data;
};

export const createLeaveRequest = async (data: { leave_type_id: number; start_date: string; end_date: string; reason?: string }) => {
    const response = await api.post('/leave-requests', data);
    return response.data;
};

export const cancelLeaveRequest = async (id: number) => {
    const response = await api.patch(`/leave-requests/${id}/cancel`);
    return response.data;
};

export const getAdminLeaveRequests = async (params?: {
    q?: string;
    employee_id?: number;
    department_id?: number;
    leave_type_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}) => {
    const response = await api.get('/leave-requests', { params });
    return response.data;
};

export const getLeaveRequestById = async (id: number) => {
    const response = await api.get(`/leave-requests/${id}`);
    return response.data;
};

export const approveLeaveRequest = async (id: number, comment?: string) => {
    const response = await api.patch(`/leave-requests/${id}/approve`, { comment });
    return response.data;
};

export const refuseLeaveRequest = async (id: number, comment: string) => {
    const response = await api.patch(`/leave-requests/${id}/refuse`, { comment });
    return response.data;
};
