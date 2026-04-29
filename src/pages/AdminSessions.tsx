import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Clock, MapPin, Hash, BarChartHorizontal, Calendar, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';
import { useAuth } from '../lib/AuthContext';

export function AdminSessions() {
  const { theme } = useAuth();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [realSessions, setRealSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/activities/summary')
      .then(res => res.json())
      .then(data => {
        if (!data.summary) return;
        
        const grouped = data.summary.reduce((acc: any, curr: any) => {
          if (!acc[curr.name]) acc[curr.name] = { id: curr.person_id, name: curr.name, totalSec: 0, activities: [] };
          acc[curr.name].totalSec += curr.total_seconds;
          acc[curr.name].activities.push(curr);
          return acc;
        }, {});

        const mapped = Object.values(grouped).map((p: any) => {
          const dist = p.activities.map((a: any) => ({
            label: a.action,
            percentage: Math.round((a.total_seconds / p.totalSec) * 100)
          }));
          
          const hrs = Math.floor(p.totalSec / 3600);
          const mins = Math.floor((p.totalSec % 3600) / 60);
          const duration = `${hrs}h ${mins}m`;

          return {
            id: p.id,
            name: p.name,
            startTime: 'NA',
            endTime: 'NA',
            date: 'NA',
            duration: duration,
            zonesVisited: ['NA'],
            activityDistribution: dist
          };
        });
        setRealSessions(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  const isLight = theme === 'light';

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter text-hive-text">Employee Sessions</h1>
        <p className="text-hive-text-40 text-[10px] uppercase font-bold tracking-[0.2em]">Employee Session Correlation with Timestamps</p>
      </header>

      <div className="space-y-4">
        {realSessions.map((session, i) => {
          return (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 group overflow-hidden relative rounded-lg"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-hive-text">
                <Hash className="w-32 h-32" />
              </div>

              <div 
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                className="flex flex-col lg:flex-row gap-8 items-start lg:items-center cursor-pointer group/card"
              >
                {/* Identity & Basic Info */}
                <div className="w-full lg:w-56 space-y-2">
                  <div className="text-lg font-extrabold tracking-tighter flex items-center gap-2 text-hive-text">
                    <span className="text-hive-text-20 font-light">#</span>{session.id}
                  </div>
                  <div className="text-sm font-bold mt-2 text-hive-text transition-colors">
                    {session.name}
                  </div>
                  <div className="text-[10px] text-hive-text-50">
                    NA
                  </div>
                  <div className="text-[10px] text-hive-text-50">
                    Employee ID: {session.id}
                  </div>
                  
                  {/* Timestamp-based session info */}
                  <div className="mt-3 pt-3 border-t border-hive-border space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">
                      <Calendar className="w-3 h-3" /> {session.date}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">
                      <Clock className="w-3 h-3" /> Start: {session.startTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">
                      <Timer className="w-3 h-3" /> End: {session.endTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">
                      <Clock className="w-3 h-3" /> Duration: {session.duration}
                    </div>
                  </div>
                </div>

                {/* Zone Timeline */}
                <div className="flex-1 w-full space-y-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-hive-text-30 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Transit Timeline
                  </div>
                  <div className="flex items-center gap-2 relative">
                    {session.zonesVisited.map((zone: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-hive-text-10 border border-hive-border text-[9px] font-bold uppercase tracking-widest rounded text-hive-text">
                          {zone}
                        </div>
                        {idx < session.zonesVisited.length - 1 && (
                          <div className="w-4 h-[1px] bg-hive-border" />
                        )}
                      </div>
                    ))}
                    <div className="flex-1 border-b border-dashed border-hive-border" />
                  </div>
                </div>

                {/* Activity Split */}
                <div className="w-full lg:w-64 space-y-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-hive-text-30 flex items-center gap-2">
                    <BarChartHorizontal className="w-3 h-3" /> Activity Mix
                  </div>
                  <div className="h-2 w-full flex bg-hive-text-10 rounded overflow-hidden">
                    {session.activityDistribution.map((dist: any, idx: number) => (
                      <div 
                        key={idx}
                        style={{ width: `${dist.percentage}%` }}
                        className={cn(
                          "h-full transition-all duration-500",
                          dist.label === 'talking' ? 'bg-hive-accent' : dist.label.includes('working') ? 'bg-hive-text-60' : 'bg-hive-text-20'
                        )}
                        title={`${dist.label}: ${dist.percentage}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] font-mono opacity-50 uppercase tracking-widest text-hive-text mt-2 flex-wrap gap-2">
                    {session.activityDistribution.map((d: any) => (
                      <span key={d.label} className="text-hive-text-40">{d.label}: {d.percentage}%</span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  className={cn(
                    "px-6 py-3 border text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-lg relative overflow-hidden group shadow-lg",
                    expandedSession === session.id 
                      ? "bg-hive-accent text-hive-black border-hive-accent shadow-xl" 
                      : "border-hive-border text-hive-text hover:border-hive-success hover:text-hive-success"
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
                  name={session.name} 
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
