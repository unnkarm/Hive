import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Activity, AlertCircle, Eye, MonitorOff, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { generateInsight } from '../services/geminiService';
import { cn } from '../lib/utils';

export function AdminDashboard() {
  const { cameras, stats, alerts } = useAppSimulator();
  const [insight, setInsight] = useState('Analyzing current workplace trends...');
  
  useEffect(() => {
    generateInsight(stats).then(setInsight);
  }, [stats.activeZones]); // Refresh insight when stats change significantly

  const data = [
    { time: '09:00', movement: 45 },
    { time: '10:00', movement: 52 },
    { time: '11:00', movement: 61 },
    { time: '12:00', movement: 48 },
    { time: '13:00', movement: 38 },
    { time: '14:00', movement: 55 },
  ];

  const zoneData = [
    { name: 'Zone A', val: 85 },
    { name: 'Zone B', val: 92 },
    { name: 'Zone C', val: 40 },
    { name: 'Zone D', val: 12 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Command Center</h1>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Real-time operational intelligence</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold opacity-30 uppercase tracking-[0.3em]">System Sync</div>
          <div className="text-lg font-mono">100.0%</div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Zap} label="Active Zones" value={stats.activeZones.toString()} color="text-white" />
        <KPICard icon={TrendingUp} label="Movement" value={`${stats.movementPercentage}%`} color="text-hive-success" />
        <KPICard icon={Activity} label="Idle Rate" value={`${stats.idlePercentage}%`} color="text-hive-warning" />
        <KPICard icon={AlertCircle} label="Active Alerts" value={stats.activeAlerts.toString()} color="text-hive-error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass p-6 border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Flux: Movement Gradient</h3>
            <div className="flex gap-4 text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white" /> Live</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', fontSize: '10px' }} 
                  itemStyle={{ color: '#FFF' }}
                />
                <Line type="monotone" dataKey="movement" stroke="#FFF" strokeWidth={3} dot={false} animationDuration={2000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="glass p-6 border-white/5">
           <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-8">Spatial Intensity Heatmap</h3>
           <div className="grid grid-cols-4 gap-2 aspect-square max-w-[300px] mx-auto">
             {Array.from({ length: 16 }).map((_, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0.1 }}
                 animate={{ 
                   opacity: [0.1, 0.4, 0.2, 0.6, 0.3][Math.floor(Math.random() * 5)],
                   backgroundColor: i % 5 === 0 ? '#FFF' : '#333'
                 }}
                 transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                 className="aspect-square border border-white/5"
               />
             ))}
           </div>
           <div className="mt-8 flex justify-between text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
              <span>Low Density</span>
              <span>High Density</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insight Card */}
        <div className="glass p-6 border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 rotate-12" />
           </div>
           <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Neural Engine: Insight</h3>
           <motion.p 
             key={insight}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-2xl font-bold tracking-tight leading-snug"
           >
             {insight}
           </motion.p>
           <div className="mt-8 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-hive-success" />
             <span className="text-[10px] text-white/40 uppercase tracking-widest">Source: Cross-Camera Correlation Analysis</span>
           </div>
        </div>

        {/* Live Camera Grid Preview */}
        <div className="glass p-6 border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Live Matrix</h3>
            <button className="text-[10px] uppercase font-bold text-white/30 hover:text-white">Expand View</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cameras.slice(0, 4).map((cam) => (
              <div key={cam.id} className="aspect-video bg-hive-black relative flex items-center justify-center group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                {cam.status === 'Online' ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={`https://picsum.photos/seed/${cam.id}/400/225?grayscale`} 
                      className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-hive-success glow-accent shadow-hive-success/50" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{cam.name}</span>
                    </div>
                    <div className="absolute bottom-2 right-2 z-20">
                      <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">Conf: {cam.confidence}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <MonitorOff className="w-8 h-8" />
                    <span className="text-[8px] uppercase tracking-[0.2em]">Offline</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass p-6 border-white/5 flex flex-col items-start gap-1 group relative overflow-hidden"
    >
      <div className="absolute top-2 right-2 text-white/5 group-hover:text-white/10 transition-colors">
        <Icon className="w-12 h-12 rotate-[-15deg]" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
      <span className={cn("text-3xl font-extrabold tracking-tighter", color)}>{value}</span>
    </motion.div>
  );
}
