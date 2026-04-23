import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Camera, Signal, Activity, Info, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export function AdminCameras() {
  const { cameras } = useAppSimulator();

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Optical Matrix</h1>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Multi-stream ingestion grid</p>
        </div>
        <button className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:invert transition-all">
          Connect New Node
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cameras.map((cam) => (
          <CameraTile key={cam.id} camera={cam} />
        ))}
      </div>
    </div>
  );
}

function CameraTile({ camera }: any) {
  const isOnline = camera.status === 'Online';
  const activityColor = {
    'High': 'text-hive-error',
    'Medium': 'text-hive-warning',
    'Low': 'text-hive-success',
    'Idle': 'text-white/40',
    'Break': 'text-white/20'
  }[camera.activity as string] || 'text-white/40';

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="glass border-white/5 flex flex-col group"
    >
      <div className="aspect-video relative overflow-hidden bg-hive-black">
        {isOnline ? (
          <img 
            src={`https://picsum.photos/seed/${camera.id}/600/400?grayscale`} 
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[3s]" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
            <Signal className="w-8 h-8 mb-2" />
            <span className="text-[10px] uppercase tracking-widest text-white/40">Signal Lost</span>
          </div>
        )}
        
        {/* Overlay Labels */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="bg-black/80 px-2 py-1 rounded-none border border-white/10 flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOnline ? "bg-hive-success" : "bg-hive-error")} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{camera.name}</span>
            </div>
            <div className="bg-black/80 px-2 py-1 rounded-none border border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{camera.zone}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm p-2 -mx-4 -mb-4 border-t border-white/10">
             <div className="flex items-center gap-2">
               <Activity className={cn("w-3 h-3", activityColor)} />
               <span className={cn("text-[9px] font-bold uppercase tracking-widest", activityColor)}>{camera.activity}</span>
             </div>
             <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">Conf: {camera.confidence}%</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-hive-dark/50 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest border-t border-white/5">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 opacity-40"><Signal className="w-3 h-3" /> Latency: {camera.latency.toFixed(0)}ms</span>
          <span className="flex items-center gap-1 opacity-40"><Info className="w-3 h-3" /> Health: {camera.health}%</span>
        </div>
        <button className="p-1 hover:bg-white/10 transition-colors">
          <MoreVertical className="w-4 h-4 opacity-40" />
        </button>
      </div>
    </motion.div>
  );
}
