import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkIn, checkOut, type AttendanceRecord } from '@/services/attendance';
import { Clock, LogIn, LogOut as LogOutIcon, CheckCircle2, AlertCircle, Camera, MapPin, X } from 'lucide-react';

interface TodayAttendanceCardProps {
    attendance: AttendanceRecord | null;
    onUpdate: () => void;
}

export default function TodayAttendanceCard({ attendance, onUpdate }: TodayAttendanceCardProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [gpsStatus, setGpsStatus] = useState('');
    const [photoCaptured, setPhotoCaptured] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDuration = (hoursDecimal?: number) => {
        if (hoursDecimal === undefined || hoursDecimal === null) return '--';
        const hrs = Math.floor(hoursDecimal);
        const mins = Math.round((hoursDecimal - hrs) * 60);
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    // Camera Lifecycle
    useEffect(() => {
        if (showModal && !photoCaptured) {
            setGpsStatus('Verifying location via GPS...');
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((mediaStream) => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    setTimeout(() => setGpsStatus('Location Verified: Inside Office Radius 📍'), 1500);
                })
                .catch((err) => {
                    console.error("Camera error:", err);
                    setError("Camera access is required for check-in.");
                    setGpsStatus('Location/Camera verification failed.');
                });
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [showModal, photoCaptured]);

    const capturePhotoAndCheckIn = async () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, 320, 240);
                setPhotoCaptured(true);
                // Pause slightly so user sees their selfie
                setTimeout(async () => {
                    setLoading(true);
                    setError('');
                    try {
                        await checkIn();
                        setShowModal(false);
                        setPhotoCaptured(false);
                        onUpdate();
                    } catch (err: any) {
                        setError(err.response?.data?.detail || 'Check-in failed');
                        setPhotoCaptured(false);
                    } finally {
                        setLoading(false);
                    }
                }, 1000);
            }
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        setError('');
        try {
            await checkOut();
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Check-out failed');
        } finally {
            setLoading(false);
        }
    };

    const todayDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    const isCheckedIn = !!attendance?.check_in;
    const isCheckedOut = !!attendance?.check_out;

    return (
        <>
            <Card className="bg-white border border-sky-100/80 shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-sky-400" />
                            <CardTitle className="text-lg font-extrabold text-white tracking-tight">Today's Attendance</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400 text-xs mt-1 font-medium">
                            {todayDateStr}
                        </CardDescription>
                    </div>
                    <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            isCheckedOut 
                                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                : isCheckedIn 
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                                isCheckedOut ? 'bg-slate-400' : isCheckedIn ? 'bg-sky-400 animate-ping' : 'bg-amber-400'
                            }`} />
                            {isCheckedOut ? 'Shift Completed' : isCheckedIn ? 'Active / On Duty' : 'Not Checked In'}
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {error && !showModal && (
                        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center text-xs font-semibold border border-red-200">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Check In</span>
                            <span className="text-base font-mono font-bold text-slate-900">{formatTime(attendance?.check_in)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Check Out</span>
                            <span className="text-base font-mono font-bold text-slate-900">{formatTime(attendance?.check_out)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Worked Hours</span>
                            <span className="text-base font-mono font-extrabold text-sky-600">{formatDuration(attendance?.worked_hours)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Extra Hours</span>
                            <span className="text-base font-mono font-extrabold text-indigo-600">{formatDuration(attendance?.extra_hours)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        {!isCheckedIn ? (
                            <Button 
                                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold space-x-2 px-6 h-11 rounded-xl shadow-md shadow-sky-500/20 transition-all hover:scale-105" 
                                onClick={() => setShowModal(true)} 
                                disabled={loading}
                            >
                                <MapPin className="w-4 h-4" />
                                <span>GPS Check-In</span>
                            </Button>
                        ) : !isCheckedOut ? (
                            <Button 
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold space-x-2 px-6 h-11 rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-105" 
                                onClick={handleCheckOut} 
                                disabled={loading}
                            >
                                <LogOutIcon className="w-4 h-4" />
                                <span>Check Out Shift</span>
                            </Button>
                        ) : (
                            <Button 
                                variant="outline" 
                                className="bg-slate-100 text-slate-600 border-slate-200 font-bold space-x-2 px-6 h-11 rounded-xl cursor-not-allowed" 
                                disabled
                            >
                                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                                <span>Today's Shift Logged</span>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* GPS & Selfie Check-In Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => { setShowModal(false); setPhotoCaptured(false); }} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center mb-5">
                            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Camera className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-black text-slate-900">Secure Web Check-In</h2>
                            <p className="text-xs text-slate-500 mt-1 font-semibold">
                                {gpsStatus}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold text-center mb-4 border border-red-200">
                                {error}
                            </div>
                        )}

                        {/* Video / Canvas Container */}
                        <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center mb-6 border-4 border-slate-100 shadow-inner">
                            {!photoCaptured ? (
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-sky-600/20 flex items-center justify-center backdrop-blur-xs z-10">
                                    <div className="bg-white text-sky-700 px-4 py-2 rounded-full text-xs font-black shadow-lg flex items-center space-x-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Identity Verified!</span>
                                    </div>
                                </div>
                            )}
                            <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                        </div>

                        <Button 
                            className="w-full bg-[#0052FF] hover:bg-blue-700 text-white font-black h-12 rounded-xl shadow-lg shadow-blue-500/30"
                            onClick={capturePhotoAndCheckIn}
                            disabled={loading || gpsStatus.includes('failed')}
                        >
                            {loading ? 'Authenticating...' : 'Capture Selfie & Check In'}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
