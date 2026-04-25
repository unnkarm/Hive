import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { generateEmployeeHistory, getSummary } from '../lib/mockData';
import { Clock, MessageSquare, Utensils, Zap, MapPin, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '../lib/utils';

interface Props {
  employeeId: string;
  name: string;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']; // Working (Emerald), Talking (Blue), Lunch (Amber), Inactive (Red)

export function EmployeeAnalyticsDashboard({ employeeId, name }: Props) {
  const history = useMemo(() => generateEmployeeHistory(employeeId), [employeeId]);
  const summary = useMemo(() => getSummary(history), [history]);

  const pieData = [
    { name: 'Working', value: parseFloat(summary.totalHours) },
    { name: 'Talking', value: parseFloat(summary.totalTalking) },
    { name: 'Lunch', value: parseFloat(summary.totalLunch) },
    { name: 'Inactive', value: history.reduce((acc, curr) => acc + curr.inactiveTime, 0) },
  ];

  const zoneData = history[0].zones.map(z => ({
    name: z.zone,
    duration: history.reduce((acc, curr) => acc + (curr.zones.find(gz => gz.zone === z.zone)?.duration || 0), 0)
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 pt-8 border-t border-white/10 space-y-12"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: `${summary.totalHours}h`, icon: Clock, color: 'text-white' },
          { label: 'Talking Time', value: `${summary.totalTalking}h`, icon: MessageSquare, color: 'text-blue-400' },
          { label: 'Lunch Breaks', value: `${summary.totalLunch}h`, icon: Utensils, color: 'text-amber-400' },
          { label: 'Attendance', value: `${summary.attendanceRate}%`, icon: Zap, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 p-5 rounded-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-white/60">
              <stat.icon className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.15em]">{stat.label}</span>
            </div>
            <div className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Progress Line Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-sm space-y-8">
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

        {/* Activity Distribution Pie Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-sm space-y-8">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Focus Distribution
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

        {/* Zone Presence Bar Chart */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-sm space-y-8">
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

        {/* Detailed Logs Table */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-sm space-y-6">
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
    </motion.div>

  );
}
