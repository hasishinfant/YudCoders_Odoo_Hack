import api from './api';

export interface Department {
    id: number;
    name: string;
    description?: string;
    created_at: string;
}

export const getDepartments = async () => {
    const response = await api.get('/departments');
    return response.data;
};

export const createDepartment = async (name: string, description?: string) => {
    const response = await api.post('/departments', { name, description });
    return response.data;
};
