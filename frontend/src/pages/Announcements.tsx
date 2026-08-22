import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Search, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  getAnnouncements, 
  createAnnouncement, 
  deleteAnnouncement, 
  type Announcement 
} from '@/services/company';

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [tag, setTag] = useState('Notice');
    const [tagColor, setTagColor] = useState('bg-blue-50 text-[#0052FF] border-blue-100');
    const [submitError, setSubmitError] = useState('');

    const loadAnnouncements = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getAnnouncements();
            setAnnouncements(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load announcements.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        if (!title.trim() || !summary.trim()) {
            setSubmitError('Title and message summary are required.');
            return;
        }
        try {
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            await createAnnouncement({
                title,
                summary,
                date: dateStr,
                tag,
                tag_color: tagColor
            });
            setTitle('');
            setSummary('');
            setIsOpen(false);
            loadAnnouncements();
        } catch (err: any) {
            setSubmitError(err.response?.data?.detail || 'Failed to post announcement.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await deleteAnnouncement(id);
            loadAnnouncements();
        } catch (err: any) {
            alert('Failed to delete announcement.');
        }
    };

    const filtered = announcements.filter(ann => 
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-5 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-[#0052FF]" />
                        Company Announcements
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Stay updated with corporate bulletins, policy shifts, holiday news, and HR alerts.
                    </p>
                </div>
                {isAdmin && (
                    <Button 
                        onClick={() => {
                            setSubmitError('');
                            setIsOpen(true);
                        }}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-black px-4 h-10 rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Post Notice</span>
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search announcements..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] shadow-2xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052FF]" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800 text-sm">No bulletins posted</p>
                    <p className="text-xs text-slate-400">Company announcements will be displayed here when published.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(ann => (
                        <Card key={ann.id} className="border border-slate-200/80 bg-white rounded-2xl shadow-2xs hover:shadow-sm transition-all duration-200">
                            <CardContent className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${ann.tag_color}`}>
                                            {ann.tag}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold font-mono">
                                            {ann.date}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-slate-900 text-sm sm:text-base break-words leading-tight">{ann.title}</h3>
                                    <p className="text-slate-600 text-xs leading-relaxed break-words whitespace-pre-wrap w-full">{ann.summary}</p>
                                </div>

                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDelete(ann.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 shrink-0 shadow-2xs self-end sm:self-start"
                                        title="Delete notice"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Post Announcement Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                                <Megaphone className="w-5 h-5 text-[#0052FF]" />
                                <span>Post Announcement</span>
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4 text-xs font-bold">
                            {submitError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl leading-relaxed">
                                    {submitError}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Bulletin Title</label>
                                <Input 
                                    placeholder="Enter title (e.g. Town Hall Meeting)" 
                                    className="h-10 text-xs rounded-xl"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Tag Label</label>
                                    <select
                                        className="w-full h-10 px-3 border rounded-xl bg-slate-50 border-slate-200 text-slate-700"
                                        value={tag}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTag(val);
                                            if (val === 'Alert') setTagColor('bg-red-50 text-red-600 border-red-100');
                                            else if (val === 'Policy') setTagColor('bg-purple-50 text-purple-600 border-purple-100');
                                            else if (val === 'Event') setTagColor('bg-emerald-50 text-emerald-600 border-emerald-100');
                                            else setTagColor('bg-blue-50 text-[#0052FF] border-blue-100');
                                        }}
                                    >
                                        <option value="Notice">Notice</option>
                                        <option value="Alert">Alert</option>
                                        <option value="Policy">Policy</option>
                                        <option value="Event">Event</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Tag Style</label>
                                    <input 
                                        className="w-full h-10 px-3 border rounded-xl bg-slate-100 border-slate-200 text-slate-500 font-mono select-all"
                                        value={tagColor}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Message summary</label>
                                <textarea
                                    rows={4}
                                    placeholder="Type notice message details..."
                                    className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-10 rounded-xl border-slate-200"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold h-10 rounded-xl px-5"
                                >
                                    Publish
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
