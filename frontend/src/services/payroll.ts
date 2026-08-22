import api from './api';

export interface EmployeeSalary {
    id: number;
    employee_id: number;
    basic_salary: number;
    allowances: number;
    gross_salary: number;
    deductions: number;
    net_salary: number;
    effective_from: string;
    created_at: string;
    updated_at: string;
}

export interface Payroll {
    id: number;
    employee_id: number;
    employee_name?: string;
    employee_code?: string;
    department_name?: string;
    month: number;
    year: number;
    period_start: string;
    period_end: string;
    basic_salary: number;
    allowances: number;
    gross_salary: number;
    deductions: number;
    net_salary: number;
    status: 'DRAFT' | 'PROCESSED' | 'PAID' | 'CANCELLED';
    comment?: string;
    worked_hours?: number;
    approved_leave_days?: number;
    generated_at: string;
    processed_at?: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
}

export const getMySalary = async () => {
    const response = await api.get('/payroll/salary/me');
    return response.data;
};

export const getEmployeeSalary = async (employeeId: number) => {
    const response = await api.get(`/payroll/salary/${employeeId}`);
    return response.data;
};

export const setEmployeeSalary = async (data: { employee_id: number; basic_salary: number; allowances?: number; deductions?: number; effective_from?: string }) => {
    const response = await api.post('/payroll/salary', data);
    return response.data;
};

export const updateEmployeeSalary = async (employeeId: number, data: Partial<EmployeeSalary>) => {
    const response = await api.patch(`/payroll/salary/${employeeId}`, data);
    return response.data;
};

export const getMyPayroll = async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get('/payroll/me', { params });
    return response.data;
};

export const getAdminPayroll = async (params?: {
    q?: string;
    employee_id?: number;
    department_id?: number;
    month?: number;
    year?: number;
    status?: string;
    skip?: number;
    limit?: number;
}) => {
    const response = await api.get('/payroll', { params });
    return response.data;
};

export const getPayrollById = async (id: number) => {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
};

export const generatePayroll = async (data: { month: number; year: number; employee_id?: number }) => {
    const response = await api.post('/payroll/generate', data);
    return response.data;
};

export const processPayroll = async (id: number) => {
    const response = await api.patch(`/payroll/${id}/process`);
    return response.data;
};

export const payPayroll = async (id: number) => {
    const response = await api.patch(`/payroll/${id}/pay`);
    return response.data;
};

export const cancelPayroll = async (id: number) => {
    const response = await api.patch(`/payroll/${id}/cancel`);
    return response.data;
};
