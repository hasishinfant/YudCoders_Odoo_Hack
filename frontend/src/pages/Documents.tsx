import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getMyDocuments,
    getAdminDocuments,
    downloadDocumentFile,
    deleteDocument,
    type DocumentItem
} from '@/services/documents';
import UploadDocumentModal from '@/components/documents/UploadDocumentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    FileText, 
    Upload, 
    Download, 
    Trash2, 
    Search, 
    Folder,
    FileCheck
} from 'lucide-react';

export default function DocumentsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    // Documents State
    const [myDocuments, setMyDocuments] = useState<DocumentItem[]>([]);
    const [adminDocuments, setAdminDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [targetEmpId, setTargetEmpId] = useState<number | null>(null);
    const [targetEmpName, setTargetEmpName] = useState<string>('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');

    const loadMyDocs = async () => {
        setLoading(true);
        try {
            const res = await getMyDocuments();
            setMyDocuments(res.data || []);
        } catch (err) {
            console.error('Failed to load employee documents', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAdminDocs = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const res = await getAdminDocuments({
                q: searchTerm || undefined,
                type: selectedType || undefined
            });
            setAdminDocuments(res.data || []);
        } catch (err) {
            console.error('Failed to load admin documents', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyDocs();
    }, []);

    useEffect(() => {
        if (activeTab === 'all' && isAdmin) {
            const timer = setTimeout(() => {
                loadAdminDocs();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, searchTerm, selectedType]);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteDocument(id);
            if (activeTab === 'my') loadMyDocs();
            else loadAdminDocs();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete document');
        }
    };

    const handleDownload = async (doc: DocumentItem) => {
        try {
            await downloadDocumentFile(doc.id, doc.name);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to download document file');
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const docTypes = ['General', 'Resume', 'ID Proof', 'Contract', 'Tax', 'Certification'];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Document Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Upload, organize, and access HR compliance files, contracts, and identity proofs.</p>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                    {isAdmin && (
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                    activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                My Documents
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                    activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All Documents
                            </button>
                        </div>
                    )}

                    <Button 
                        onClick={() => {
                            setTargetEmpId(user?.id || 1);
                            setTargetEmpName(user?.email || '');
                            setIsUploadOpen(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 h-10 space-x-1.5"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Document</span>
                    </Button>
                </div>
            </div>

            {activeTab === 'my' ? (
                /* My Documents */
                <Card className="bg-white border-slate-200">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                            <Folder className="w-5 h-5 text-emerald-600" />
                            <span>My Document Directory</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading documents...</div>
                        ) : myDocuments.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 space-y-2">
                                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-semibold text-sm">No documents uploaded yet</p>
                                <p className="text-xs text-slate-400">Upload your ID proof, resume, or tax forms securely.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                            <th className="p-3.5 pl-6">Document Name</th>
                                            <th className="p-3.5">Category</th>
                                            <th className="p-3.5">File Size</th>
                                            <th className="p-3.5">Uploaded Date</th>
                                            <th className="p-3.5 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {myDocuments.map(doc => (
                                            <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3.5 pl-6 font-bold text-slate-900 flex items-center space-x-2">
                                                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>{doc.name}</span>
                                                </td>
                                                <td className="p-3.5">
                                                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                                                        {doc.type}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 font-mono text-slate-500">{formatFileSize(doc.file_size)}</td>
                                                <td className="p-3.5 text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                                                <td className="p-3.5 text-right pr-6 space-x-2">
                                                    <button
                                                        onClick={() => handleDownload(doc)}
                                                        className="text-slate-900 hover:text-emerald-600 font-bold text-xs inline-flex items-center space-x-1"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>Download</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="text-red-500 hover:text-red-700 font-semibold text-xs inline-flex items-center ml-2"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* Admin View */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative sm:col-span-2">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input 
                                placeholder="Search document name, type, employee..." 
                                className="pl-9 h-10 text-xs"
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="h-10 px-3 py-2 text-xs border rounded-md bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
                            value={selectedType}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {docTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading organization documents...</div>
                            ) : adminDocuments.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 space-y-2">
                                    <Folder className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="font-semibold text-sm">No documents found matching filters</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                                <th className="p-3.5 pl-6">Employee</th>
                                                <th className="p-3.5">Document Title</th>
                                                <th className="p-3.5">Category</th>
                                                <th className="p-3.5">Size</th>
                                                <th className="p-3.5">Uploaded</th>
                                                <th className="p-3.5 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {adminDocuments.map(doc => (
                                                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 pl-6 font-semibold text-slate-900">
                                                        <div>{doc.employee_name || 'N/A'}</div>
                                                        <div className="font-mono text-[10px] text-slate-500 font-normal">{doc.employee_code}</div>
                                                    </td>
                                                    <td className="p-3.5 font-bold text-slate-900">{doc.name}</td>
                                                    <td className="p-3.5">
                                                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                                                            {doc.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-mono text-slate-500">{formatFileSize(doc.file_size)}</td>
                                                    <td className="p-3.5 text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                                                    <td className="p-3.5 text-right pr-6 space-x-3">
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            className="text-slate-900 hover:text-emerald-600 font-bold text-xs inline-flex items-center space-x-1"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                            <span>Download</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="text-red-500 hover:text-red-700 font-semibold text-xs inline-flex items-center"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal */}
            <UploadDocumentModal 
                employeeId={targetEmpId || 1}
                employeeName={targetEmpName}
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={() => {
                    if (activeTab === 'my') loadMyDocs();
                    else loadAdminDocs();
                }}
            />
        </div>
    );
}
