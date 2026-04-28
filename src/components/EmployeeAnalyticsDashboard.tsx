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
  const [activityView, setActivityView] = useState<ActivityView>('breakdown');

  // Productivity activities: Working, Eating, Discussing
  // Non-productivity activities: Talking, Smoking, Loitering
  const pieData = [
    { name: 'Working', value: parseFloat(summary.totalHours), type: 'productive' },
    { name: 'Talking', value: parseFloat(summary.totalTalking), type: 'non-productive' },
    { name: 'Lunch', value: parseFloat(summary.totalLunch), type: 'productive' },
    { name: 'Inactive', value: history.reduce((acc, curr) => acc + curr.inactiveTime, 0), type: 'non-productive' },
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

  const zoneData = history[0].zones.map(z => ({
    name: z.zone,
    duration: history.reduce((acc, curr) => acc + (curr.zones.find(gz => gz.zone === z.zone)?.duration || 0), 0)
  }));

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
      {/* View Toggle */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActivityView('breakdown')}
          className={cn(
            "px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded",
            activityView === 'breakdown' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white"
          )}
        >
          <TrendingUp className="w-3 h-3 inline mr-2" /> Activity Breakdown
        </button>
        <button 
          onClick={() => setActivityView('heatmap')}
          className={cn(
            "px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded",
            activityView === 'heatmap' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white"
          )}
        >
          <MapPin className="w-3 h-3 inline mr-2" /> Zone Heat Map
        </button>
      </div>

      {activityView === 'breakdown' ? (
        <>
          {/* Productivity vs Non-Productivity Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-hive-success/10 border border-hive-success/20 p-5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-hive-success" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-hive-success">Productivity Activities</span>
              </div>
              <div className="text-3xl font-black text-hive-success">{productiveTotal.toFixed(1)}h</div>
              <div className="text-[9px] text-white/50 mt-1">Working + Eating + Discussing</div>
            </div>
            <div className="bg-hive-error/10 border border-hive-error/20 p-5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-hive-error" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-hive-error">Non-Productivity Activities</span>
              </div>
              <div className="text-3xl font-black text-hive-error">{nonProductiveTotal.toFixed(1)}h</div>
              <div className="text-[9px] text-white/50 mt-1">Talking + Smoking + Loitering</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Productivity Score', value: `${((productiveTotal / (productiveTotal + nonProductiveTotal)) * 10).toFixed(1)}/10`, icon: Zap, color: 'text-amber-400' },
              { label: 'Total Hours', value: `${summary.totalHours}h`, icon: Clock, color: 'text-white' },
              { label: 'Talking Time', value: `${summary.totalTalking}h`, icon: MessageSquare, color: 'text-blue-400' },
              { label: 'Lunch Breaks', value: `${summary.totalLunch}h`, icon: Utensils, color: 'text-amber-400' },
              { label: 'Attendance', value: `${summary.attendanceRate}%`, icon: Zap, color: 'text-emerald-400' },
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
            {/* Detailed Activity Breakdown */}
            <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-6">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Detailed Activity Breakdown
              </h4>
              
              {/* Productivity Section */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-hive-success mb-2">Productivity Activities</div>
                {activityBreakdown.filter(a => a.type === 'productive').map((item) => (
                  <div key={item.activity} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold">{item.activity}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${(item.hours / 8) * 100}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="font-mono text-sm font-bold w-12 text-right" style={{ color: item.color }}>{item.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Non-Productivity Section */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-hive-error mb-2">Non-Productivity Activities</div>
                {activityBreakdown.filter(a => a.type === 'non-productive').map((item) => (
                  <div key={item.activity} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold">{item.activity}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${(item.hours / 8) * 100}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="font-mono text-sm font-bold w-12 text-right" style={{ color: item.color }}>{item.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Distribution Pie Chart */}
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
                  <motion.div 
                    key={hour} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: hour * 0.05 }}
                    className="space-y-4"
                  >
                    <div className="text-[9px] font-black text-white/30 text-center tracking-tighter">{hour}:00</div>
                    <div className="relative group h-32">
                      <div 
                        className={cn(
                          "h-full w-full rounded-sm border transition-all duration-300 relative z-10 flex flex-col justify-end overflow-hidden",
                          isProductive 
                            ? "bg-hive-success/5 border-hive-success/20 group-hover:bg-hive-success/20 group-hover:border-hive-success/50" 
                            : "bg-hive-error/5 border-hive-error/20 group-hover:bg-hive-error/20 group-hover:border-hive-error/50"
                        )}
                        title={`${hour}:00 - ${activity}`}
                      >
                        {/* Dynamic Height Fill */}
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.random() * 60 + 40}%` }}
                          className={cn(
                            "w-full transition-colors",
                            isProductive ? "bg-hive-success/40" : "bg-hive-error/40"
                          )}
                        />
                        
                        {/* Activity Label */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap text-white">
                             {activity}
                           </span>
                        </div>
                      </div>
                      
                      {/* Glow effect */}
                      <div className={cn(
                        "absolute inset-0 blur-xl opacity-0 group-hover:opacity-10 transition-opacity",
                        isProductive ? "bg-hive-success" : "bg-hive-error"
                      )} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex gap-6 text-[8px] font-bold uppercase tracking-widest pt-4 border-t border-white/5">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-hive-success" /> Productive</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-hive-error" /> Non-Productive / Flagged</div>
            </div>
          </div>
        </>
      ) : (
        /* Heat Map View */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Zone Heat Map */}
            <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-6">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" /> Zone Heat Map
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {heatmapData.map((cell, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center"
                    style={{ backgroundColor: getHeatColor(cell.intensity) }}
                    title={`${cell.zone} - ${Math.round(cell.intensity * 100)}% activity`}
                  >
                    <span className="text-[10px] font-bold uppercase text-white/80">{cell.zone}</span>
                    <span className="text-[12px] font-mono text-white">{Math.round(cell.intensity * 100)}%</span>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-bold uppercase tracking-[0.2em]">
                <span className="text-blue-400">Low</span>
                <span className="text-green-400">Medium</span>
                <span className="text-amber-400">High</span>
                <span className="text-red-400">Very High</span>
              </div>
            </div>

            {/* Zone Occupancy */}
            <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-6">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" /> Zone Occupancy
              </h4>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff" 
                      fontSize={11} 
                      fontWeight="900"
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis hide />
                    <Tooltip 
                       cursor={{ fill: '#ffffff05' }}
                       contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px', fontWeight: '900' }}
                    />
                    <Bar dataKey="duration" radius={[6, 6, 0, 0]} barSize={50}>
                       {zoneData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#3B82F6'} fillOpacity={1 - (index * 0.15)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Progress Line Chart - Always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Performance Trend
            </h4>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-white/40 uppercase">Monthly Avg</span>
               <span className="text-sm font-black text-emerald-400">{summary.avgHours}h/day</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  hide 
                />
                <YAxis 
                  stroke="#ffffff80" 
                  fontSize={11}
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px', fontWeight: '900' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hoursWorked" 
                  stroke="#10B981" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Logs Table */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-6">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90">Employee Daily Journal</h4>
          <div className="max-h-[280px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {history.slice(0, 15).map((day, i) => (
              <div key={day.date} className="flex items-center justify-between py-4 border-b border-white/5 group/row hover:bg-white/5 px-2 transition-colors rounded-sm">
                <div className="flex flex-col">
                  <span className="font-black tracking-widest text-white text-xs mb-1">{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-sm w-fit",
                    day.topActivity === 'Productive' ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50"
                  )}>{day.topActivity}</span>
                </div>
                <div className="flex gap-8">
                  <div className="flex flex-col items-end">
                    <span className="text-white/30 uppercase font-black text-[9px] tracking-tight">Active</span>
                    <span className="font-black text-white text-sm">{day.hoursWorked}h</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-blue-400/50 uppercase font-black text-[9px] tracking-tight">Comm</span>
                    <span className="font-black text-blue-400 text-sm">{day.talkingTime}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Metrics: Productivity Gauge & Zone Transit Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Productivity Gauge */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg flex flex-col items-center justify-center space-y-6">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90">Consistency Score</h4>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
              <motion.circle 
                cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={502.4}
                initial={{ strokeDashoffset: 502.4 }}
                animate={{ strokeDashoffset: 502.4 - (502.4 * 0.82) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-hive-success"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">8.2</span>
              <span className="text-[10px] font-bold text-white/40 uppercase">Top 5%</span>
            </div>
          </div>
          <p className="text-[10px] text-center text-white/50 uppercase leading-loose tracking-widest">
            Employee maintains high focus in <span className="text-white">Zone A</span> with minimal loitering flags.
          </p>
        </div>

        {/* Zone Transit Flow Plot */}
        <div className="lg:col-span-2 bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90">Zone Transit Frequency (30D)</h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px', fontWeight: '900' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="duration" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {zoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Administrative Area
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-hive-success" /> Operational Zone
            </div>
          </div>
        </div>
      </div>

      {/* Deep Intelligence Modules: Radar, Area, Scatter, Radial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Behavioral Radar Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
             <Shield className="w-4 h-4 text-blue-400" /> Workplace Behavioral Profile
          </h4>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={name}
                  dataKey="A"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.4}
                />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity vs Inactivity Area Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Cumulative Distribution
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#ffffff20" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px' }} />
                <Area type="monotone" dataKey="productive" stroke="#10B981" fillOpacity={1} fill="url(#colorProd)" />
                <Area type="monotone" dataKey="nonProductive" stroke="#EF4444" fillOpacity={1} fill="url(#colorNon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intensity Scatter Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Focus Correlation
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="hours" name="Productive" unit="h" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="talking" name="Talking" unit="h" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Intensity" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', fontSize: '11px' }} />
                <Scatter name="Days" data={scatterData} fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift Completion Radial Bar */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Objective Completion
          </h4>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={15} data={radialData}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 8, fontWeight: 'bold' }}
                  background
                  dataKey="value"
                />
                <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 30-Day Activity Snapshots (GitHub Style) */}
      <div className="bg-white/5 border border-white/5 p-8 rounded-lg space-y-8">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> 30-Day Activity Snapshots
          </h4>
          <div className="flex gap-2 items-center text-[9px] font-black uppercase tracking-widest text-white/30">
            <span>Low Intensity</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-[2px] bg-white/5" />
              <div className="w-3 h-3 rounded-[2px] bg-hive-success/20" />
              <div className="w-3 h-3 rounded-[2px] bg-hive-success/40" />
              <div className="w-3 h-3 rounded-[2px] bg-hive-success/70" />
              <div className="w-3 h-3 rounded-[2px] bg-hive-success" />
            </div>
            <span>High Intensity</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 justify-between">
          {Array.from({ length: 30 }).map((_, i) => {
            const intensity = Math.random();
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            
            return (
              <motion.div 
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: 1.4, zIndex: 10 }}
                className={cn(
                  "w-6 h-6 rounded-[2px] transition-all cursor-help relative group",
                  intensity > 0.8 ? "bg-hive-success shadow-[0_0_10px_rgba(0,255,0,0.3)]" :
                  intensity > 0.6 ? "bg-hive-success/60" :
                  intensity > 0.4 ? "bg-hive-success/30" :
                  intensity > 0.2 ? "bg-hive-success/10" :
                  "bg-white/5"
                )}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black border border-white/20 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}: {Math.round(intensity * 100)}% Productivity
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>

  );
} 

