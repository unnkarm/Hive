import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { generateEmployeeHistory, getSummary } from '../lib/mockData';
import { Clock, MessageSquare, Utensils, Zap, MapPin, TrendingUp, AlertTriangle, Users, Layers, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../lib/utils';

interface Props {
  employeeId: string;
  name: string;
}

type ActivityView = 'breakdown' | 'heatmap';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']; 

export function EmployeeAnalyticsDashboard({ employeeId, name }: Props) {
  const history = useMemo(() => generateEmployeeHistory(employeeId), [employeeId]);
  const summary = useMemo(() => getSummary(history), [history]);


  // Productivity activities: Working, Eating, Discussing
  // Non-productivity activities: Talking, Smoking, Loitering
  const pieData = [
    { name: 'Working', value: summary.totalHours ? parseFloat(summary.totalHours) : 0, type: 'productive' },
    { name: 'Talking', value: summary.totalTalking ? parseFloat(summary.totalTalking) : 0, type: 'non-productive' },
    { name: 'Lunch', value: summary.totalLunch ? parseFloat(summary.totalLunch) : 0, type: 'productive' },
    { name: 'Inactive', value: history.reduce((acc, curr) => acc + (curr.inactiveTime || 0), 0), type: 'non-productive' },
  ];

  // Detailed activity breakdown
  const activityBreakdown = [
    { activity: 'Working', hours: 6.5, type: 'productive', color: '#10B981' },
    { activity: 'Eating', hours: 1.0, type: 'productive', color: '#F59E0B' },
    { activity: 'Discussing', hours: 0.8, type: 'productive', color: '#3B82F6' },
    { activity: 'Talking', hours: 0.5, type: 'non-productive', color: '#EF4444' },
    { activity: 'Smoking', hours: 0.2, type: 'non-productive', color: '#8B5CF6' },
    { activity: 'Loitering', hours: 0.3, type: 'non-productive', color: '#EC4899' },
  ];

  const zoneData = history.length > 0 ? history[0].zones.map(z => ({
    name: z.zone,
    duration: history.reduce((acc, curr) => acc + (curr.zones.find(gz => gz.zone === z.zone)?.duration || 0), 0)
  })) : [];

  // Behavioral Profile Data (Radar)
  const radarData = [
    { subject: 'Focus', A: 85, fullMark: 100 },
    { subject: 'Teamwork', A: 70, fullMark: 100 },
    { subject: 'Efficiency', A: 95, fullMark: 100 },
    { subject: 'Safety', A: 100, fullMark: 100 },
    { subject: 'Reliability', A: 80, fullMark: 100 },
  ];

  // Cumulative Productivity (Area)
  const areaData = history.slice(0, 10).map((d, i) => ({
    date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    productive: d.hoursWorked,
    nonProductive: d.talkingTime + (d.inactiveTime / 60)
  }));

  // Goal Status (Radial)
  const radialData = [
    { name: 'Shift Target', value: 8, fill: '#3B82F6' },
    { name: 'Completed', value: 6.8, fill: '#10B981' },
    { name: 'Overtime', value: 1.2, fill: '#F59E0B' },
  ];

  // Intensity Correlation (Scatter)
  const scatterData = history.map(d => ({
    hours: d.hoursWorked,
    talking: d.talkingTime,
    z: d.hoursWorked * 10
  }));

  // Heat map data for zones
  const heatmapData = [
    { zone: 'Zone A', x: 0, y: 0, intensity: 0.85 },
    { zone: 'Zone A', x: 1, y: 0, intensity: 0.7 },
    { zone: 'Zone B', x: 0, y: 1, intensity: 0.6 },
    { zone: 'Zone B', x: 1, y: 1, intensity: 0.9 },
    { zone: 'Zone C', x: 0, y: 2, intensity: 0.3 },
    { zone: 'Zone C', x: 1, y: 2, intensity: 0.2 },
    { zone: 'Zone D', x: 0, y: 3, intensity: 0.1 },
    { zone: 'Zone D', x: 1, y: 3, intensity: 0.15 },
  ];

  const getHeatColor = (intensity: number) => {
    if (intensity >= 0.8) return '#EF4444';
    if (intensity >= 0.6) return '#F59E0B';
    if (intensity >= 0.4) return '#10B981';
    if (intensity >= 0.2) return '#3B82F6';
    return '#1E3A5F';
  };

  const productiveTotal = activityBreakdown.filter(a => a.type === 'productive').reduce((acc, a) => acc + a.hours, 0);
  const nonProductiveTotal = activityBreakdown.filter(a => a.type === 'non-productive').reduce((acc, a) => acc + a.hours, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 pt-8 border-t border-white/10 space-y-12"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: `${summary.totalHours || 0}h`, icon: Clock, color: 'text-white' },
          { label: 'Talking Time', value: `${summary.totalTalking || 0}h`, icon: MessageSquare, color: 'text-blue-400' },
          { label: 'Lunch Breaks', value: `${summary.totalLunch || 0}h`, icon: Utensils, color: 'text-amber-400' },
          { label: 'Attendance', value: `${summary.attendanceRate || 0}%`, icon: Zap, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 p-5 rounded-lg hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-white/60">
              <stat.icon className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.15em]">{stat.label}</span>
            </div>
            <div className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Merged Activity Breakdown & Zone Heatmap */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <div className="flex justify-between items-center">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Activity & Zone Intel
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Activity Lists */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-hive-success mb-2">Productive</div>
                {activityBreakdown.filter(a => a.type === 'productive').map((item) => (
                  <div key={item.activity} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/70">{item.activity}</span>
                    <span className="font-mono text-sm font-bold text-hive-success">{item.hours}h</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-hive-error mb-2">Non-Productive</div>
                {activityBreakdown.filter(a => a.type === 'non-productive').map((item) => (
                  <div key={item.activity} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/70">{item.activity}</span>
                    <span className="font-mono text-sm font-bold text-hive-error">{item.hours}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Heatmap (Mini) */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Zone Distribution</div>
              <div className="grid grid-cols-2 gap-2">
                {heatmapData.filter((_, i) => i % 2 === 0).map((cell, i) => {
                  const color = getHeatColor(cell.intensity);
                  return (
                    <div 
                      key={i} 
                      className="aspect-square rounded border border-white/10 flex flex-col items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: `${color}10` }}
                    >
                      <span className="text-[8px] font-black uppercase text-white/30 mb-1">{cell.zone}</span>
                      <span className="text-xs font-black text-white">{Math.round(cell.intensity * 100)}%</span>
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color, opacity: cell.intensity }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Focus Distribution Pie Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-6">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Focus Distribution
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
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px', fontWeight: '900' }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical"
                  iconType="circle"
                  formatter={(value) => <span className="text-[11px] font-black uppercase tracking-widest text-white/90">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Activity Timeline */}
      <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" /> Hourly Activity Timeline
        </h4>
        <div className="grid grid-cols-12 gap-3">
          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => {
            const activities = ['Working', 'Talking', 'Lunch', 'Discussing', 'Loitering'];
            const activity = activities[Math.floor(Math.random() * activities.length)];
            const isProductive = ['Working', 'Lunch', 'Discussing'].includes(activity);
            
            return (
              <div key={hour} className="space-y-4">
                <div className="text-[9px] font-black text-white/30 text-center tracking-tighter">{hour}:00</div>
                <div className="h-32 bg-white/5 border border-white/10 rounded-sm relative group overflow-hidden">
                   <div 
                     className={cn(
                       "absolute bottom-0 w-full transition-all duration-1000",
                       isProductive ? "bg-hive-success/40" : "bg-hive-error/40"
                     )}
                     style={{ height: `${Math.random() * 60 + 30}%` }}
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black uppercase -rotate-90 text-white">{activity}</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Journal */}
      <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-6">
        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90">Employee Daily Journal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
          {history.slice(0, 10).map((day, i) => (
            <div key={i} className="p-4 bg-white/5 border border-white/5 rounded flex justify-between items-center group hover:bg-white/10 transition-all">
              <div>
                <div className="text-xs font-bold text-white/80">{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">{day.topActivity}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-hive-success">{day.hoursWorked}h</div>
                <div className="text-[9px] text-white/30 font-mono">HASH: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
