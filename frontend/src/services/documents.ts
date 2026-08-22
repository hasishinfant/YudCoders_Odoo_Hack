import api from './api';

export interface DocumentItem {
    id: number;
    employee_id: number;
    employee_name?: string;
    employee_code?: string;
    name: string;
    type: string;
    file_reference: string;
    file_size?: number;
    uploaded_by?: number;
    uploader_email?: string;
    created_at: string;
    updated_at: string;
}

export const getMyDocuments = async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get('/documents/me', { params });
    return response.data;
};

export const getAdminDocuments = async (params?: {
    q?: string;
    employee_id?: number;
    type?: string;
    skip?: number;
    limit?: number;
}) => {
    const response = await api.get('/documents', { params });
    return response.data;
};

export const uploadDocument = async (formData: FormData) => {
    const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const downloadDocumentFile = async (id: number, filename: string) => {
    const response = await api.get(`/documents/${id}/file`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const deleteDocument = async (id: number) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
};
