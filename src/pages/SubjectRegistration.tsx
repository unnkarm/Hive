import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, ShieldCheck, UserCheck, X, Upload, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

type PhotoType = 'front' | 'left' | 'right' | 'fullBody';

interface PhotoState {
  front: string | null;
  left: string | null;
  right: string | null;
  fullBody: string | null;
}

export function SubjectRegistration() {
  const { theme } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<PhotoType>('front');
  const [photos, setPhotos] = useState<PhotoState>({ front: null, left: null, right: null, fullBody: null });
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setPhotos(prev => ({ ...prev, [activePhoto]: dataUrl }));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, photoType: PhotoType) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [photoType]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const registerSubject = () => {
    setIsScanning(true);
    // Simulate biometric processing
    setTimeout(() => {
      const newId = `S-${Math.random().toString(36).substring(7).toUpperCase()}`;
      setRegisteredId(newId);
      setIsScanning(false);
    }, 2000);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const photoLabels: Record<PhotoType, string> = {
    front: 'Front Face',
    left: 'Left Profile',
    right: 'Right Profile',
    fullBody: 'Full Body'
  };

  const isLight = theme === 'light';

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <header>
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter text-hive-text">Employee Enrollment</h1>
        <p className="text-hive-text-40 text-[10px] uppercase font-bold tracking-[0.2em]">Add new employee to tracking system - Capture 4 angles for facial recognition</p>
      </header>

      <div className="space-y-8">
        {/* Enrollment Form - Now Above Camera */}
        <div className="glass p-6 rounded-lg space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-hive-text-30 ml-1">Full Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" className="w-full bg-hive-input-bg border border-hive-border p-3 text-sm rounded outline-none focus:border-hive-text-40 transition-all text-hive-text placeholder:text-hive-text-20" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-hive-text-30 ml-1">Department</label>
                <input type="text" placeholder="e.g. Operations" className="w-full bg-hive-input-bg border border-hive-border p-3 text-sm rounded outline-none focus:border-hive-text-40 transition-all text-hive-text placeholder:text-hive-text-20" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-hive-text-30 ml-1">Role / Designation</label>
                <input type="text" placeholder="e.g. Manager" className="w-full bg-hive-input-bg border border-hive-border p-3 text-sm rounded outline-none focus:border-hive-text-40 transition-all text-hive-text placeholder:text-hive-text-20" />
              </div>
            </div>
            <button 
              disabled={isScanning || !photos.front || !photos.left || !photos.right || !photos.fullBody}
              onClick={registerSubject}
              className={cn(
                "px-8 py-3.5 font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 rounded-lg text-sm min-w-[200px] shadow-lg",
                isScanning || !photos.front || !photos.left || !photos.right || !photos.fullBody
                  ? "bg-hive-text-10 text-hive-text-20 cursor-not-allowed border border-hive-border" 
                  : "bg-hive-accent text-hive-black hover:bg-hive-success border border-hive-accent"
              )}
            >
              <UserCheck className="w-4 h-4" />
              Enroll Subject
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass relative aspect-video overflow-hidden bg-black flex items-center justify-center rounded-lg">
            {stream && mode === 'camera' ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover grayscale opacity-60"
                />
                
                {/* Scanning UI Overlay - High contrast for dark video */}
                <div className="absolute inset-0 pointer-events-none border-4 border-white/5 m-4 rounded-lg">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40" />
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/40" />
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/40" />
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40" />
                   
                   <AnimatePresence>
                     {isScanning && (
                       <motion.div 
                          initial={{ top: '0%' }}
                          animate={{ top: '100%' }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-0.5 bg-hive-success glow-accent shadow-[0_0_15px_rgba(0,255,0,0.8)] z-20"
                       />
                     )}
                   </AnimatePresence>

                   {/* Face Frame */}
                   <div className="absolute inset-12 border border-white/10 flex items-center justify-center">
                      <div className="w-px h-12 bg-white/10 absolute -top-6" />
                      <div className="w-px h-12 bg-white/10 absolute -bottom-6" />
                      <div className="h-px w-12 bg-white/10 absolute -left-6" />
                      <div className="h-px w-12 bg-white/10 absolute -right-6" />
                   </div>
                </div>

                {/* Active Photo Type Indicator */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-lg">
                  <span className="text-xs font-bold uppercase tracking-widest text-white">
                    Capturing: {photoLabels[activePhoto]}
                  </span>
                </div>
              </>
            ) : !stream ? (
              <div className="flex flex-col items-center gap-4 text-hive-text-20">
                <Camera className="w-16 h-16" />
                <button 
                  onClick={startCamera}
                  className="text-[10px] uppercase font-bold tracking-widest hover:text-hive-text transition-colors"
                >
                  Activate Optical Sensor
                </button>
              </div>
            ) : null}

            {error && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center gap-4 rounded-lg">
                <span className="text-hive-error text-xs font-bold uppercase tracking-widest">{error}</span>
                <button 
                  onClick={startCamera}
                  className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest border border-white/20 px-4 py-2 hover:bg-white/5 transition-colors text-white"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Connection
                </button>
              </div>
            )}
          </div>

          {/* Photo Type Selector */}
          <div className="glass p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50">Select Photo Type</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMode('camera')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all",
                    mode === 'camera' ? "bg-hive-accent text-hive-black shadow-sm" : "border border-hive-border text-hive-text-60 hover:text-hive-text"
                  )}
                >
                  <Camera className="w-3 h-3 inline mr-1" /> Camera
                </button>
                <button 
                  onClick={() => setMode('upload')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all",
                    mode === 'upload' ? "bg-hive-accent text-hive-black shadow-sm" : "border border-hive-border text-hive-text-60 hover:text-hive-text"
                  )}
                >
                  <Upload className="w-3 h-3 inline mr-1" /> Upload
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(photoLabels) as PhotoType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActivePhoto(type)}
                  className={cn(
                    "py-3 px-2 text-[10px] font-black uppercase tracking-widest rounded transition-all border",
                    activePhoto === type 
                      ? "bg-hive-accent text-hive-black border-hive-accent shadow-sm" 
                      : "bg-hive-text-10 text-hive-text-60 border-hive-border hover:border-hive-text-30",
                    photos[type] && "ring-2 ring-hive-success"
                  )}
                >
                  {photos[type] && <Check className="w-3 h-3 inline mr-1" />}
                  {photoLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Capture/Upload Button */}
          {mode === 'camera' ? (
            <button 
              onClick={capturePhoto}
              disabled={!stream}
              className={cn(
                "w-full py-4 font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 rounded-lg shadow-xl",
                stream ? "bg-hive-accent text-hive-black hover:bg-hive-success" : "bg-hive-text-10 text-hive-text-20 cursor-not-allowed"
              )}
            >
              <Camera className="w-4 h-4" />
              Capture {photoLabels[activePhoto]}
            </button>
          ) : (
            <div className="border-2 border-dashed border-hive-border rounded-lg p-8 text-center hover:border-hive-text-40 transition-colors bg-hive-text-10 group cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, activePhoto)}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-hive-text-40 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest text-hive-text-60 group-hover:text-hive-text">
                  Click to upload {photoLabels[activePhoto]}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Status & Options */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-lg h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Biometric Snapshots
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(photoLabels) as PhotoType[]).map((type) => (
                  <div 
                    key={type} 
                    className={cn(
                      "border p-2 rounded text-center text-[10px] font-black uppercase tracking-widest transition-all",
                      photos[type] ? "border-hive-success bg-hive-success/10 text-hive-success" : "border-hive-border text-hive-text-30 bg-hive-text-10"
                    )}
                  >
                    {photos[type] ? (
                      <div className="aspect-square mb-2 rounded overflow-hidden shadow-sm">
                        <img src={photos[type]!} alt={photoLabels[type]} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square mb-2 rounded bg-hive-text-10 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-hive-text-20" />
                      </div>
                    )}
                    {photoLabels[type]}
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {registeredId && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-hive-success p-6 text-hive-black rounded-lg mt-8 shadow-2xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Enrollment Success</h4>
                       <button onClick={() => setRegisteredId(null)} className="hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="text-4xl font-extrabold tracking-tighter mb-2">
                      {registeredId}
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                      Subject enrolled in optical grid.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
