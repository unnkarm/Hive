import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { cn } from '../lib/utils';
import { Activity, Coffee, User, Briefcase, Zap, AlertTriangle, Target, Eye } from 'lucide-react';

interface Props {
  mode?: 'person' | 'zone' | 'all';
}

export function LiveTrackingPortal({ mode = 'all' }: Props) {
  const { cameras } = useAppSimulator();

  const occupancyData = [
    { name: 'CAMTEEN', val: 98 },
    { name: 'WORKSTATION', val: 84 },
    { name: 'COLLAB', val: 68 },
  ];

  const deptData = [
    { name: 'OPERATIONS', val: 89 },
    { name: 'SYSTEM', val: 81 },
    { name: 'FINANCE', val: 70 },
    { name: 'HR', val: 83 },
    { name: 'ENGINEERING', val: 94 },
  ];

  const subjects = [
    { id: 'E-021', status: 'WORKSTATION', time: '8h 21m', name: 'Rahul Sharma' },
    { id: 'E-004', status: 'MEETING ROOM', time: '4h 04m', name: 'Priya Patel' },
    { id: 'E-071', status: 'CANTEEN', time: '0h 05m', name: 'Amit Singh' },
    { id: 'E-012', status: 'CANTEEN', time: '0h 02m', name: 'Sneha Gupta' },
    { id: 'E-062', status: 'WORKSTATION', time: '7h 30m', name: 'Vikram Mehta' },
  ];

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col font-mono uppercase tracking-tighter">
      {/* Header */}
      <header className="border-b border-hive-border pb-4 mb-4 flex items-center justify-between px-2">
        <div className="flex gap-8 text-[11px] font-bold">
          <span className="opacity-40">TRACKING MODE: <span className={cn("text-hive-success", mode === 'person' ? "text-blue-400" : mode === 'zone' ? "text-amber-400" : "text-hive-success")}>{mode.toUpperCase()}</span></span>
          <span className="opacity-40">// SUBJECTS ACTIVE: <span className="text-white">214</span> <div className="inline-block w-2 h-2 rounded-full bg-hive-warning align-middle ml-1" /></span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left column: Subjects / Focus */}
        <div className="col-span-3 border border-hive-border p-4 flex flex-col gap-4 overflow-hidden bg-white/[0.02]">
          <div>
            <h2 className="text-[12px] font-bold opacity-60 mb-6 flex items-center gap-2">
              {mode === 'person' ? <User className="w-4 h-4 text-blue-400" /> : <Activity className="w-4 h-4 text-white/40" />}
              {mode === 'person' ? 'Subject Focus' : 'Presence Monitoring'}
            </h2>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-extrabold tracking-tighter">{mode === 'person' ? '01' : '214'}</span>
              <span className="text-[10px] opacity-40">{mode === 'person' ? 'Target Active' : 'Subjects Present'}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
            {subjects.map((s, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-3 border border-white/5 flex flex-col gap-1 text-[10px] tracking-widest transition-all",
                  mode === 'person' && i === 0 ? "bg-blue-500/20 border-blue-500/40" : "hover:bg-white/5"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-white/90">{s.name}</span>
                  <span className="opacity-40">{s.time}</span>
                </div>
                <div className="flex gap-2">
                  <span className="opacity-40">{s.id}</span>
                  <span className="opacity-20">/</span>
                  <span className={cn("opacity-60", mode === 'person' && i === 0 ? "text-blue-400" : "")}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center column: Live Feed */}
        <div className="col-span-6 flex flex-col gap-4">
          <div className="flex-1 border border-hive-border relative overflow-hidden group bg-black">
            <h2 className="absolute top-4 left-4 z-20 text-[12px] font-bold opacity-60 flex items-center gap-2">
               {mode === 'person' ? <Target className="w-4 h-4 text-blue-400" /> : mode === 'zone' ? <Layers className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-hive-success" />}
               {mode === 'person' ? 'Optical Tracking: Rahul Sharma' : mode === 'zone' ? 'Zone Analysis: WORKSTATION_A' : 'Master Multi-Stream'}
            </h2>
            
            {/* The Image */}
            <div className="absolute inset-0 grayscale brightness-50 group-hover:brightness-75 transition-all duration-700">
              <img 
                src={mode === 'person' 
                  ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
                  : mode === 'zone'
                  ? "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
                  : "https://picsum.photos/seed/tracking/1200/800?grayscale"
                }
                className="w-full h-full object-cover"
                alt="Tracking View"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Tracking Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
               {mode === 'person' ? (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="w-48 h-64 border-2 border-blue-500/60 relative"
                 >
                   <div className="absolute -top-10 left-0 bg-blue-500 text-black px-3 py-1 font-black text-[10px] whitespace-nowrap">
                     SUBJECT IDENTIFIED // R. SHARMA
                   </div>
                   <div className="absolute -bottom-6 right-0 text-blue-400 text-[8px] font-bold">
                     99.2% CONFIDENCE
                   </div>
                 </motion.div>
               ) : mode === 'zone' ? (
                 <div className="absolute inset-20 border-2 border-amber-500/40 grid grid-cols-4 grid-rows-4">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-amber-500/10 flex items-center justify-center text-[8px] text-amber-500/20">
                        {Math.floor(Math.random() * 90)}
                      </div>
                    ))}
                    <div className="absolute -top-10 left-0 bg-amber-500 text-black px-3 py-1 font-black text-[10px] whitespace-nowrap">
                      ZONE GRID: INTENSITY_MAP_V4
                    </div>
                 </div>
               ) : (
                 <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="border border-white/5 relative">
                         <div className="absolute top-2 left-2 text-[8px] opacity-40">CAM-0{i+1}</div>
                         <div className="absolute inset-10 border border-hive-success/20 animate-pulse" />
                      </div>
                    ))}
                 </div>
               )}
            </div>

            {/* Technical Detail */}
            <div className="absolute bottom-4 right-4 z-20 text-[8px] opacity-30 flex flex-col items-end">
               <span>BITRATE: {mode === 'all' ? '12.4' : '4.2'} MBPS</span>
               <span>FPS: {mode === 'all' ? '60.0' : '24.0'}</span>
               <span>GRID: {mode.toUpperCase()}_MODE_ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right column: Analytics */}
        <div className="col-span-3 border border-hive-border p-4 flex flex-col gap-6 overflow-hidden bg-white/[0.02]">
          <section>
            <h2 className="text-[11px] font-bold opacity-60 mb-6 flex items-center gap-2">
               <Zap className="w-4 h-4 text-hive-success" /> System Intelligence
            </h2>
            <div className="space-y-4">
               <div className="text-[9px] opacity-40 mb-2">Resource Allocation</div>
               {deptData.map(d => (
                 <div key={d.name} className="space-y-1">
                   <div className="flex justify-between text-[10px] tracking-widest">
                     <span className="opacity-60">{d.name}</span>
                     <span className="opacity-80">{d.val}%</span>
                   </div>
                   <div className="h-1 bg-white/5 w-full">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${d.val}%` }}
                       className={cn("h-full bg-white", mode === 'person' ? "bg-blue-400" : mode === 'zone' ? "bg-amber-400" : "bg-white")}
                     />
                   </div>
                 </div>
               ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] opacity-40 mb-4 tracking-widest">Active Alerts</h2>
            <div className="space-y-2">
              {[
                { type: 'IDLE', val: '0m 42s', color: 'text-white/40' },
                { type: 'MOVEMENT', val: 'DETECTED', color: 'text-hive-success' },
                { type: 'ANOMALY', val: 'NONE', color: 'text-white/20' }
              ].map((a, i) => (
                <div key={i} className="flex justify-between text-[10px] tracking-widest p-2 bg-white/5">
                  <span className="opacity-60">{a.type}</span>
                  <span className={cn("font-bold", a.color)}>{a.val}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex-1 flex flex-col gap-4">
             <div className="p-4 border border-white/5 bg-black/40 space-y-3">
               <div className="text-[10px] font-bold opacity-60 flex items-center gap-2">
                 <ShieldCheck className="w-3 h-3 text-hive-success" />
                 Secure Hash Output
               </div>
               <p className="text-[8px] font-mono opacity-20 break-all leading-tight">
                 0x4A92B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0
               </p>
             </div>
          </section>
        </div>

      </div>
    </div>
  );
}

const Layers = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
