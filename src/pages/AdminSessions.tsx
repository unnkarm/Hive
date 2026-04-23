import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Clock, MapPin, Hash, BarChartHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

export function AdminSessions() {
  const { sessions } = useAppSimulator();

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Anonymous Threads</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Pseudonymous Session Correlation</p>
      </header>

      <div className="space-y-4">
        {sessions.map((session, i) => (
          <motion.div 
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass border-white/5 p-6 hover:border-white/20 transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Hash className="w-32 h-32" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
              {/* Identity & Basic Info */}
              <div className="w-full lg:w-48 space-y-2">
                <div className="text-lg font-extrabold tracking-tighter flex items-center gap-2">
                  <span className="text-white/20 font-light">#</span>{session.id}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.startTime}</span>
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.duration}</span>
                </div>
              </div>

              {/* Zone Timeline */}
              <div className="flex-1 w-full space-y-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                   <MapPin className="w-3 h-3" /> Transit Timeline
                </div>
                <div className="flex items-center gap-2 relative">
                  {session.zonesVisited.map((zone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest">
                        {zone}
                      </div>
                      {idx < session.zonesVisited.length - 1 && (
                        <div className="w-4 h-[1px] bg-white/20" />
                      )}
                    </div>
                  ))}
                  <div className="flex-1 border-b border-dashed border-white/10" />
                </div>
              </div>

              {/* Activity Split */}
              <div className="w-full lg:w-64 space-y-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                   <BarChartHorizontal className="w-3 h-3" /> Activity Mix
                </div>
                <div className="h-2 w-full flex bg-white/5 rounded-none overflow-hidden">
                  {session.activityDistribution.map((dist, idx) => (
                    <div 
                      key={idx}
                      style={{ width: `${dist.percentage}%` }}
                      className={cn(
                        "h-full",
                        dist.label === 'High' ? 'bg-white' : dist.label === 'Medium' ? 'bg-white/60' : 'bg-white/20'
                      )}
                      title={`${dist.label}: ${dist.percentage}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[8px] font-mono opacity-50 uppercase tracking-widest">
                   {session.activityDistribution.map(d => (
                     <span key={d.label}>{d.label}: {d.percentage}%</span>
                   ))}
                </div>
              </div>

              <button className="px-4 py-2 border border-white/20 hover:border-white text-[9px] font-bold uppercase tracking-widest transition-all">
                Full Profile
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
