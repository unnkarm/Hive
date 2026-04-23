import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { cn } from '../lib/utils';
import { Activity, Coffee, User, Briefcase, Zap, AlertTriangle } from 'lucide-react';

export function LiveTrackingPortal() {
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
    { id: 'E-021', status: 'WORKSTATION', time: '8h 21m' },
    { id: 'E-004', status: 'MEETING ROOM', time: '4h 04m' },
    { id: 'E-071', status: 'CANTEEN', time: '0h 05m' },
    { id: 'E-012', status: 'CANTEEN', time: '0h 02m' },
    { id: 'E-062', status: 'WORKSTATION', time: '7h 30m' },
    { id: 'E-121', status: 'CO-LAB ROOM', time: '2h 10m' },
    { id: 'E-135', status: 'CO-LAB ROOM', time: '1h 08m' },
    { id: 'E-101', status: 'WORKSTATION', time: '3h 25m' },
  ];

  return (
    <div className="h-screen bg-hive-black text-white p-4 flex flex-col font-mono uppercase tracking-tighter">
      {/* Header */}
      <header className="border-b border-hive-border pb-4 mb-4 flex items-center justify-between px-2">
        <div className="flex gap-8 text-[11px] font-bold">
          <span className="opacity-40">PRODUCTIVE // STATUS: <span className="text-hive-success">LIVE</span></span>
          <span className="opacity-40">// SUBJECTS ACTIVE: <span className="text-white">214</span> <div className="inline-block w-2 h-2 rounded-full bg-hive-warning align-middle ml-1" /></span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left column: Presence */}
        <div className="col-span-3 border border-hive-border p-4 flex flex-col gap-4 overflow-hidden">
          <div>
            <h2 className="text-[12px] font-bold opacity-60 mb-6">Presence & Productivity</h2>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-extrabold tracking-tighter">214</span>
              <span className="text-[10px] opacity-40">Subjects Present</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
            {subjects.map((s, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-3 border border-white/5 flex justify-between items-center text-[10px] tracking-widest",
                  i === 0 ? "bg-white/10 border-white/20" : "hover:bg-white/5"
                )}
              >
                <div className="flex gap-2">
                  <span className="opacity-80">{s.id}</span>
                  <span className="opacity-20">/</span>
                  <span className="opacity-40">{s.status}</span>
                </div>
                <span className="opacity-40">{s.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center column: Live Feed */}
        <div className="col-span-6 flex flex-col gap-4">
          <div className="flex-1 border border-hive-border relative overflow-hidden group">
            <h2 className="absolute top-4 left-4 z-20 text-[12px] font-bold opacity-60">Live Feed</h2>
            
            {/* The Image */}
            <div className="absolute inset-0 grayscale brightness-75 group-hover:brightness-90 transition-all duration-700">
              <img 
                src="https://picsum.photos/seed/tracking/1200/800?grayscale" 
                className="w-full h-full object-cover"
                alt="Tracking View"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Tracking Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-48 h-96 border-2 border-white/40 relative"
               >
                 <div className="absolute -top-10 left-0 bg-black/80 px-3 py-1 border border-white/20 text-[10px] whitespace-nowrap">
                   E-021 // COFFEE ZONE // 00H 1.2M
                 </div>
               </motion.div>
            </div>

            {/* Technical Detail */}
            <div className="absolute bottom-4 right-4 z-20 text-[8px] opacity-30 flex flex-col items-end">
               <span>BITRATE: 4.2 MBPS</span>
               <span>FPS: 24.0</span>
               <span>ISO: 800</span>
            </div>
          </div>
        </div>

        {/* Right column: Insights */}
        <div className="col-span-3 border border-hive-border p-4 flex flex-col gap-6 overflow-hidden">
          <section>
            <h2 className="text-[11px] font-bold opacity-60 mb-6">Operational Insights</h2>
            <div className="space-y-4">
               <div className="text-[9px] opacity-40 mb-2">Department Productivity</div>
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
                       className="h-full bg-white opacity-80"
                     />
                   </div>
                 </div>
               ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] opacity-40 mb-4 tracking-widest">Zone Occupancy Rankings</h2>
            <div className="space-y-2">
              {occupancyData.map((o, i) => (
                <div key={o.name} className="flex justify-between text-[10px] tracking-widest">
                  <span className="opacity-60">{i + 1}. {o.name}</span>
                  <span className="opacity-20 text-xs">...</span>
                  <span className="opacity-80">{o.val}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex-1 flex flex-col gap-4">
             <div className="space-y-2">
               <div className="text-[9px] opacity-40 uppercase tracking-widest">Flagged Recent Zone Events</div>
               <div className="p-3 bg-hive-warning/10 border border-hive-warning/20 text-hive-warning text-[9px] tracking-widest">
                  E-B-S-900 / COFFEE ROOM / 12:13 AM
               </div>
             </div>

             <div className="p-4 border border-white/5 bg-white/5 space-y-3">
               <div className="text-[10px] font-bold opacity-60 flex items-center gap-2">
                 <AlertTriangle className="w-3 h-3 text-hive-warning" />
                 Operational Alert
               </div>
               <p className="text-[9px] opacity-40 leading-relaxed">
                 System Optimization Suggested: Increase system capacity for Zone Cluster-4.
               </p>
             </div>
          </section>
        </div>

      </div>
    </div>
  );
}
