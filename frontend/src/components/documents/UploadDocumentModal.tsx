import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { uploadDocument } from '@/services/documents';
import { AlertCircle, X, Upload } from 'lucide-react';

interface UploadDocumentModalProps {
    employeeId: number;
    employeeName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UploadDocumentModal({ employeeId, employeeName, isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
    const [name, setName] = useState('');
    const [docType, setDocType] = useState('General');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const docTypes = ['General', 'Resume', 'ID Proof', 'Contract', 'Tax', 'Certification'];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('employee_id', String(employeeId));
        formData.append('name', name || file.name);
        formData.append('type', docType);
        formData.append('file', file);

        try {
            await uploadDocument(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload document.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-emerald-400" />
                        <span>Upload Document {employeeName ? `— ${employeeName}` : ''}</span>
                    </CardTitle>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-xs font-medium border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Document Title / Name
                            </label>
                            <Input 
                                placeholder="e.g. Passport Copy, Employment Contract"
                                className="h-10 text-xs"
                                value={name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Document Category
                            </label>
                            <select
                                className="w-full h-10 px-3 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                                value={docType}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value)}
                            >
                                {docTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                File Attachment
                            </label>
                            <Input 
                                type="file"
                                className="h-10 text-xs"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFile(e.target.files[0]);
                                    }
                                }}
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose} 
                                className="text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5"
                                disabled={loading}
                            >
                                {loading ? 'Uploading...' : 'Upload Document'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
