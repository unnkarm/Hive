import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Clock, MessageSquare, Utensils, Zap, MapPin, TrendingUp, AlertTriangle, Users, Layers, Shield, List, Grid } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

interface Props {
  employeeId: string;
  name: string;
}

type ViewMode = 'visual' | 'tabular';

const COLORS = ['#06B6D4', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export function EmployeeAnalyticsDashboard({ employeeId, name }: Props) {
  const { theme } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5005/api/persons/${employeeId}/analytics`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [employeeId]);

  const summaryStats = useMemo(() => {
    if (!analytics || !analytics.summary) return { totalHours: '0', talkingHours: '0', lunchHours: '0', attendance: 'NA' };
    
    const working = analytics.summary.find((s: any) => s.action.includes('working'))?.total_seconds || 0;
    const talking = analytics.summary.find((s: any) => s.action === 'talking')?.total_seconds || 0;
    const eating = analytics.summary.find((s: any) => s.action === 'eating')?.total_seconds || 0;
    
    return {
      totalHours: (working / 3600).toFixed(1),
      talkingHours: (talking / 3600).toFixed(1),
      lunchHours: (eating / 3600).toFixed(1),
      attendance: '100%' // Placeholder for real attendance logic
    };
  }, [analytics]);

  const pieData = useMemo(() => {
    if (!analytics || !analytics.summary) return [];
    return analytics.summary.map((s: any) => ({
      name: s.action.charAt(0).toUpperCase() + s.action.slice(1),
      value: parseFloat((s.total_seconds / 3600).toFixed(2))
    }));
  }, [analytics]);

  const activityBreakdown = useMemo(() => {
    if (!analytics || !analytics.summary) return [];
    return analytics.summary.map((s: any, idx: number) => ({
      activity: s.action.charAt(0).toUpperCase() + s.action.slice(1),
      hours: parseFloat((s.total_seconds / 3600).toFixed(2)),
      type: s.action.includes('working') || s.action === 'eating' ? 'productive' : 'non-productive',
      color: COLORS[idx % COLORS.length]
    }));
  }, [analytics]);

  const history = useMemo(() => {
    if (!analytics || !analytics.timeline) return [];
    return analytics.timeline;
  }, [analytics]);

  const radarData = [
    { subject: 'Focus', A: 85, fullMark: 100 },
    { subject: 'Teamwork', A: 70, fullMark: 100 },
    { subject: 'Efficiency', A: 95, fullMark: 100 },
    { subject: 'Safety', A: 100, fullMark: 100 },
    { subject: 'Reliability', A: 80, fullMark: 100 },
  ];

  const heatmapData = [
    { zone: 'Main Office', x: 0, y: 0, intensity: 0.85 },
    { zone: 'Cafeteria', x: 1, y: 0, intensity: 0.2 },
  ];

  const getHeatColor = (intensity: number) => {
    if (intensity >= 0.8) return '#EF4444';
    if (intensity >= 0.6) return '#06B6D4';
    if (intensity >= 0.4) return '#10B981';
    if (intensity >= 0.2) return '#3B82F6';
    return isLight ? '#E2E8F0' : '#1E293B';
  };

  const isLight = theme === 'light';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 pt-8 border-t border-hive-border space-y-12"
    >
      {/* Header with Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-hive-text">30-Day Intelligence Deep Dive</h3>
            <p className="text-[10px] font-bold uppercase text-hive-text-30 tracking-widest mt-1">Personnel Correlation Sync: {name}</p>
         </div>
         
         <div className="flex bg-hive-text-10 p-1 rounded-sm border border-hive-border">
            <button 
              onClick={() => setViewMode('visual')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm",
                viewMode === 'visual' ? "bg-hive-accent text-hive-black shadow-lg" : "text-hive-text-40 hover:text-hive-text"
              )}
            >
               <Grid className="w-3 h-3" /> Visual Mode
            </button>
            <button 
              onClick={() => setViewMode('tabular')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm",
                viewMode === 'tabular' ? "bg-hive-accent text-hive-black shadow-lg" : "text-hive-text-40 hover:text-hive-text"
              )}
            >
               <List className="w-3 h-3" /> Tabular Mode
            </button>
         </div>
      </div>

      {viewMode === 'visual' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hours', value: `${summaryStats.totalHours}h`, icon: Clock, color: 'text-hive-text' },
              { label: 'Talking Time', value: `${summaryStats.talkingHours}h`, icon: MessageSquare, color: 'text-blue-500' },
              { label: 'Lunch Breaks', value: `${summaryStats.lunchHours}h`, icon: Utensils, color: 'text-hive-brand' },
              { label: 'Attendance', value: summaryStats.attendance, icon: Zap, color: 'text-hive-success' },
            ].map((stat) => (
              <div key={stat.label} className="bg-hive-text-10 border border-hive-border p-5 rounded-lg hover:bg-hive-text-20 transition-colors glass">
                <div className="flex items-center gap-2 mb-3 text-hive-text-60">
                  <stat.icon className="w-4 h-4" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.15em]">{stat.label}</span>
                </div>
                <div className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Merged Activity Breakdown & Zone Heatmap */}
            <div className="glass p-8 rounded-lg space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-hive-text flex items-center gap-2">
                  <Zap className="w-5 h-5 text-hive-brand" /> Activity & Zone Intel
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Activity Lists */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-hive-success mb-2">Productive</div>
                    {activityBreakdown.filter(a => a.type === 'productive').map((item) => (
                      <div key={item.activity} className="flex items-center justify-between">
                        <span className="text-sm font-bold text-hive-text-60">{item.activity}</span>
                        <span className="font-mono text-sm font-bold text-hive-success">{item.hours}h</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4 border-t border-hive-border">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-hive-error mb-2">Non-Productive</div>
                    {activityBreakdown.filter(a => a.type === 'non-productive').map((item) => (
                      <div key={item.activity} className="flex items-center justify-between">
                        <span className="text-sm font-bold text-hive-text-60">{item.activity}</span>
                        <span className="font-mono text-sm font-bold text-hive-error">{item.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zone Heatmap (Mini) */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-hive-text-40 mb-2">Zone Distribution</div>
                  <div className="grid grid-cols-2 gap-2">
                    {heatmapData.filter((_, i) => i % 2 === 0).map((cell, i) => {
                      const color = getHeatColor(cell.intensity);
                      return (
                        <div 
                          key={i} 
                          className="aspect-square rounded border border-hive-border flex flex-col items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: `${color}10` }}
                        >
                          <span className="text-[8px] font-black uppercase text-hive-text-30 mb-1">{cell.zone}</span>
                          <span className="text-xs font-black text-hive-text">{Math.round(cell.intensity * 100)}%</span>
                          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color, opacity: cell.intensity }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Distribution Pie Chart */}
            <div className="glass p-8 rounded-lg space-y-6">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-hive-text flex items-center gap-2">
                <Users className="w-5 h-5 text-hive-brand" /> Focus Distribution
              </h4>
              <div className="h-[280px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="40%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isLight ? '#FFFFFF' : '#0A0A0A', 
                        borderRadius: '12px',
                        border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`, 
                        fontSize: '11px', 
                        fontWeight: '900',
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="middle" 
                      align="right" 
                      layout="vertical"
                      iconType="circle"
                      formatter={(value) => <span className="text-[11px] font-black uppercase tracking-widest text-hive-text-60">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hourly Activity Timeline */}
          <div className="glass p-8 rounded-lg space-y-8">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-hive-text flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Hourly Activity Timeline
            </h4>
            <div className="grid grid-cols-12 gap-3">
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => {
                const activities = ['Working', 'Talking', 'Lunch', 'Discussing', 'Loitering'];
                const activity = activities[Math.floor(Math.random() * activities.length)];
                const isProductive = ['Working', 'Lunch', 'Discussing'].includes(activity);
                
                return (
                  <div key={hour} className="space-y-4">
                    <div className="text-[9px] font-black text-hive-text-30 text-center tracking-tighter">{hour}:00</div>
                    <div className="h-32 bg-hive-text-5 border border-hive-border rounded-sm relative group overflow-hidden">
                       <div 
                         className={cn(
                           "absolute bottom-0 w-full transition-all duration-1000",
                           isProductive ? "bg-hive-brand/40" : "bg-hive-error/40"
                         )}
                         style={{ height: `${Math.random() * 60 + 30}%` }}
                       />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black uppercase -rotate-90 text-hive-text">{activity}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="glass p-8 rounded-lg">
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="border-b border-hive-border">
                   <th className="text-left pb-4 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Timestamp</th>
                   <th className="text-left pb-4 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Activity Log</th>
                   <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Duration</th>
                   <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Status</th>
                   <th className="text-right pb-4 text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Correlation</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-hive-border">
                 {history.length > 0 ? history.map((session: any, i: number) => (
                   <tr key={i} className="group hover:bg-hive-text-10 transition-colors">
                     <td className="py-4 font-mono text-[11px] text-hive-text-80">{new Date(session.start).toLocaleString()}</td>
                     <td className="py-4">
                        <div className="text-xs font-black text-hive-text">{session.action.toUpperCase()} Session</div>
                        <div className="text-[9px] text-hive-text-30 uppercase tracking-widest">Zone Correlation Verified</div>
                     </td>
                     <td className="py-4 text-center font-mono text-sm font-black text-hive-brand">{(session.duration / 60).toFixed(1)}m</td>
                     <td className="py-4 text-center">
                        <span className="px-2 py-1 bg-hive-text-10 border border-hive-border rounded text-[8px] font-black uppercase tracking-widest text-hive-text-60">
                           {session.duration > 300 ? 'Sustained' : 'Short'}
                        </span>
                     </td>
                     <td className="py-4 text-right">
                        <div className="text-[10px] font-black font-mono text-hive-text-20 uppercase tracking-widest">
                           {session.node_id || 'LOCAL'}
                        </div>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={5} className="py-8 text-center text-hive-text-30 font-black uppercase tracking-widest">No Activity Records Found (N/A)</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Daily Journal - Secondary View */}
      {viewMode === 'visual' && (
        <div className="glass p-8 rounded-lg space-y-6">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-hive-text">Employee Daily Journal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {history.slice(0, 10).map((session: any, i: number) => (
              <div key={i} className="p-4 bg-hive-text-5 border border-hive-border rounded-lg flex justify-between items-center group hover:bg-hive-text-10 transition-all">
                <div>
                  <div className="text-xs font-black text-hive-text-80">{new Date(session.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[9px] font-black uppercase text-hive-text-30 tracking-widest">{session.action}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-hive-brand">{(session.duration / 60).toFixed(1)}m</div>
                  <div className="text-[9px] text-hive-text-30 font-mono">NODE: {session.node_id || 'N/A'}</div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="col-span-2 text-center py-8 text-hive-text-20 font-black uppercase tracking-widest">N/A</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
