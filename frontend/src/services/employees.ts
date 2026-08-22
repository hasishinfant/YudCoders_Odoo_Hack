import api from './api';

export interface Employee {
    id: number;
    user_id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    job_title?: string;
    joining_date?: string;
    employment_status: string;
    company_name?: string;
    location?: string;
    avatar_url?: string;
    about?: string;
    skills?: string;
    certifications?: string;
    department_id?: number;
    department_name?: string;
    email?: string;
    user_active: boolean;
    user_role: string;
    created_at: string;
}

export interface EmployeeCreatePayload {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    job_title?: string;
    joining_date?: string;
    department_id?: number;
    company_name?: string;
    location?: string;
}

export interface EmployeeCreateResponse {
    id: number;
    user_id: number;
    employee_code: string;
    login_id: string;
    initial_password: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title?: string;
    department_id?: number;
    department_name?: string;
    joining_date?: string;
    employment_status: string;
    company_name?: string;
    location?: string;
    created_at: string;
}

export const getEmployees = async (params?: { q?: string; department_id?: number; skip?: number; limit?: number }) => {
    const response = await api.get('/employees', { params });
    return response.data;
};

export const getMyProfile = async () => {
    const response = await api.get('/employees/me');
    return response.data;
};

export const getEmployeeById = async (id: number) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
};

export const createEmployee = async (data: EmployeeCreatePayload) => {
    const response = await api.post('/employees', data);
    return response.data;
};

export const updateEmployee = async (id: number, data: Partial<Employee>) => {
    const response = await api.patch(`/employees/${id}`, data);
    return response.data;
};

export const updateMyProfile = async (data: { phone?: string; address?: string; avatar_url?: string; about?: string; skills?: string; certifications?: string }) => {
    const response = await api.patch('/employees/me', data);
    return response.data;
};

export const setEmployeeStatus = async (id: number, active: boolean) => {
    const response = await api.patch(`/employees/${id}/status`, { active });
    return response.data;
};
