import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, ShieldCheck, UserCheck, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function SubjectRegistration() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <header>
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Identity Enrollment</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Pseudonymous Subject Onboarding</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera View */}
        <div className="glass border-white/5 relative aspect-square overflow-hidden bg-hive-black flex items-center justify-center">
          {stream ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover grayscale opacity-60"
              />
              
              {/* Scanning UI Overlay */}
              <div className="absolute inset-0 pointer-events-none border-4 border-white/5 m-4">
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/20">
              <Camera className="w-16 h-16" />
              <button 
                onClick={startCamera}
                className="text-[10px] uppercase font-bold tracking-widest hover:text-white"
              >
                Activate Optical Sensor
              </button>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-hive-black/90 flex flex-col items-center justify-center p-8 text-center gap-4">
              <span className="text-hive-error text-xs font-bold uppercase tracking-widest">{error}</span>
              <button 
                onClick={startCamera}
                className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest border border-white/20 px-4 py-2 hover:bg-white/5"
              >
                <RefreshCw className="w-3 h-3" /> Retry Connection
              </button>
            </div>
          )}
        </div>

        {/* Status & Options */}
        <div className="space-y-6">
          <div className="glass p-8 border-white/5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Enrollment Protocol</h3>
            
            <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">
               Hold subject within framing guides for automated hashing. 
               System will generate a unique session signature without storing biometric RAW data.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-hive-success" />
                <span>Zero-Knowledge Encryption Active</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-hive-success" />
                <span>Hash-Only Persistence Enabled</span>
              </div>
            </div>

            <button 
              disabled={isScanning || !stream}
              onClick={registerSubject}
              className={cn(
                "w-full py-4 font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                isScanning || !stream 
                  ? "bg-white/5 text-white/20 cursor-not-allowed" 
                  : "bg-white text-black hover:invert"
              )}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Hashing In Progress...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Generate Signature
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {registeredId && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-hive-success p-6 text-black"
              >
                <div className="flex justify-between items-start mb-4">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest">Enrollment Success</h4>
                   <button onClick={() => setRegisteredId(null)}><X className="w-4 h-4" /></button>
                </div>
                <div className="text-4xl font-extrabold tracking-tighter mb-2">
                  {registeredId}
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  Subject successfully enrolled in optical grid nodes Cam-01, Cam-02.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
