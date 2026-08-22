import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getAdminDocuments,
    downloadDocumentFile,
    deleteDocument,
    type DocumentItem
} from '@/services/documents';
import { Card, CardContent } from '@/components/ui/card';
import { 
    FileText, 
    Download, 
    Trash2, 
    Search, 
    Building2
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminDocumentsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    // Admin State
    const [adminDocuments, setAdminDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');

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
        const timer = setTimeout(() => {
            loadAdminDocs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedType]);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteDocument(id);
            loadAdminDocs();
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

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Compliance & Documents</h1>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            HR COMPLIANCE CENTER
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Access, download, and verify verified identity contracts and files uploaded by employees.</p>
                </div>
            </div>

            {/* Admin Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative sm:col-span-2">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <Input 
                        placeholder="Search employee name, code, file name..." 
                        className="pl-9 h-10 text-xs rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="h-10 px-3 py-2 text-xs border rounded-xl bg-white border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 font-bold text-slate-700"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                >
                    <option value="">All Document Types</option>
                    <option value="IDENTITY">IDENTITY PROOF</option>
                    <option value="CONTRACT">EMPLOYMENT CONTRACT</option>
                    <option value="COMPLIANCE">HR COMPLIANCE</option>
                    <option value="OTHER">OTHER</option>
                </select>
            </div>

            {/* Admin Documents Table */}
            <Card className="bg-white border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading compliance documents...</div>
                    ) : adminDocuments.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 space-y-2">
                            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-sm">No employee documents uploaded yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                        <th className="p-3.5 pl-6">Employee</th>
                                        <th className="p-3.5">Document Details</th>
                                        <th className="p-3.5">Type</th>
                                        <th className="p-3.5">Size</th>
                                        <th className="p-3.5">Uploaded Date</th>
                                        <th className="p-3.5 text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {adminDocuments.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3.5 pl-6 font-bold text-slate-900">
                                                <div>{doc.employee_name || 'N/A'}</div>
                                                <div className="font-mono text-[10px] text-slate-500 font-normal">{doc.employee_code}</div>
                                            </td>
                                            <td className="p-3.5">
                                                <div className="flex items-center space-x-2">
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                    <span className="font-bold text-slate-900">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                                                    {doc.type}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-mono text-slate-600">{formatBytes(doc.file_size || 0)}</td>
                                            <td className="p-3.5 text-slate-600">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-3.5 text-right pr-6 space-x-1">
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg inline-flex items-center transition-colors border border-slate-200"
                                                    title="Download File"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg inline-flex items-center transition-colors border border-red-100"
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
    );
}
