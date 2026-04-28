import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Clock, MapPin, Hash, BarChartHorizontal, Calendar, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';

export function AdminSessions() {
  const { sessions } = useAppSimulator();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Generate timestamp-based session data
  const getSessionTimestamp = (sessionId: string, index: number) => {
    const baseDate = new Date();
    baseDate.setHours(8, 15 + index * 15, 0);
    return {
      startTimestamp: baseDate.toISOString(),
      endTimestamp: new Date(baseDate.getTime() + (45 + index * 15) * 60000).toISOString(),
      date: baseDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      startTime: baseDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      endTime: new Date(baseDate.getTime() + (45 + index * 15) * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Employee Sessions</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Employee Session Correlation with Timestamps</p>
      </header>

      <div className="space-y-4">
        {sessions.map((session, i) => {
          const timestamp = getSessionTimestamp(session.id, i);
          return (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass border-white/5 p-6 hover:border-white/20 transition-all group overflow-hidden relative rounded-lg"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Hash className="w-32 h-32" />
              </div>

              <div 
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                className="flex flex-col lg:flex-row gap-8 items-start lg:items-center cursor-pointer group/card"
              >
                {/* Identity & Basic Info */}
                <div className="w-full lg:w-56 space-y-2">
                  <div className="text-lg font-extrabold tracking-tighter flex items-center gap-2">
                    <span className="text-white/20 font-light">#</span>{session.id}
                  </div>
                  <div className="text-sm font-bold mt-2 group-hover/card:text-white transition-colors">
                    {i % 2 === 0 ? 'Rahul Sharma' : 'Priya Patel'}
                  </div>
                  <div className="text-[10px] text-white/50">
                    {i % 2 === 0 ? '123 Worker Lane, City' : '456 Employee St, City'}
                  </div>
                  <div className="text-[10px] text-white/50">
                    Employee ID: EMP-{session.id}
                  </div>
                  
                  {/* Timestamp-based session info */}
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <Calendar className="w-3 h-3" /> {timestamp.date}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <Clock className="w-3 h-3" /> Start: {timestamp.startTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <Timer className="w-3 h-3" /> End: {timestamp.endTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <Clock className="w-3 h-3" /> Duration: {session.duration}
                    </div>
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
                        <div className="px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest rounded">
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
                  <div className="h-2 w-full flex bg-white/5 rounded overflow-hidden">
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

                <button 
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  className={cn(
                    "px-6 py-3 border text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-lg relative overflow-hidden group",
                    expandedSession === session.id 
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "border-white/20 text-white hover:border-hive-success hover:text-hive-success shadow-lg"
                  )}
                >
                  <span className="relative z-10">{expandedSession === session.id ? 'Close Analytics' : '30-Day Analytics'}</span>
                  {expandedSession !== session.id && (
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-hive-success/5 pointer-events-none"
                    />
                  )}
                </button>
              </div>

              
              {/* 30 Days Expanded View */}
              {expandedSession === session.id && (
                <EmployeeAnalyticsDashboard 
                  employeeId={session.id} 
                  name={i % 2 === 0 ? 'Rahul Sharma' : 'Priya Patel'} 
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

