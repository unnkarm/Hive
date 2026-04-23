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
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Dashboard</h1>
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

      {/* Removed sections: Flux, Heatmap, Neural Engine, Live Matrix */}
      
      {/* Worker Productivity section */}
      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="glass p-6 border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-8">Worker Productivity</h3>
          <div className="flex flex-col gap-4">
            {[
              { id: '1', name: 'Rahul Sharma', score: 8.5, hours: 8, timestamp: '2026-04-23 16:00' },
              { id: '2', name: 'Priya Patel', score: 9.2, hours: 9, timestamp: '2026-04-23 16:15' },
              { id: '3', name: 'Amit Singh', score: 6.8, hours: 6, timestamp: '2026-04-23 15:45' }
            ].map(worker => (
              <div key={worker.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm font-bold">{worker.name}</div>
                  <div className="text-xs opacity-50">Last Active: {worker.timestamp}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-hive-success">{worker.score} / 10</div>
                  <div className="text-xs opacity-50">{worker.hours} hours logged</div>
                </div>
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
