import api from './api';

export const getEmployeeReport = async () => {
    const response = await api.get('/reports/employee');
    return response.data;
};

export const getAttendanceReport = async (params?: { start_date?: string; end_date?: string; department_id?: number }) => {
    const response = await api.get('/reports/attendance', { params });
    return response.data;
};

export const getLeaveReport = async (params?: { start_date?: string; end_date?: string; department_id?: number }) => {
    const response = await api.get('/reports/leave', { params });
    return response.data;
};

export const getPayrollReport = async (params?: { month?: number; year?: number; department_id?: number }) => {
    const response = await api.get('/reports/payroll', { params });
    return response.data;
};

export const exportReportCsv = async (type: string) => {
    const response = await api.get(`/reports/export?type=${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dayflow_${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
