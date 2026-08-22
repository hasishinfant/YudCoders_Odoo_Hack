import api from './api';

export const login = async (credentials: {email: string, password: string}) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const changePassword = async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};
