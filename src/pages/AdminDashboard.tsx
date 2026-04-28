import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Activity, AlertCircle, Eye, MonitorOff, TrendingUp, Zap, Clock, Calendar, ChevronRight, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { generateInsight } from '../services/geminiService';
import { cn } from '../lib/utils';

export function AdminDashboard() {
  const { cameras, stats, alerts } = useAppSimulator();
  const [insight, setInsight] = useState('Analyzing current workplace trends...');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dailyScore' | 'weeklyScore' | 'monthlyScore' | 'name'>('dailyScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
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

  // Worker productivity data with daily, weekly, monthly scores
  const workers = [
    { 
      id: '1', 
      name: 'Rahul Sharma', 
      department: 'Operations',
      dailyScore: 8.5, 
      weeklyScore: 8.2, 
      monthlyScore: 7.9,
      hoursWorked: '8h 23m',
      lastActive: '2026-04-28 14:45:22',
      snapshots: ['Working', 'Discussion', 'Working', 'Break', 'Working']
    },
    { 
      id: '2', 
      name: 'Priya Patel', 
      department: 'Engineering',
      dailyScore: 9.2, 
      weeklyScore: 8.8, 
      monthlyScore: 8.5,
      hoursWorked: '7h 45m',
      lastActive: '2026-04-28 14:30:12',
      snapshots: ['Working', 'Working', 'Meeting', 'Working', 'Discussion']
    },
    { 
      id: '3', 
      name: 'Amit Singh', 
      department: 'Finance',
      dailyScore: 6.8, 
      weeklyScore: 7.1, 
      monthlyScore: 7.4,
      hoursWorked: '6h 12m',
      lastActive: '2026-04-28 14:15:00',
      snapshots: ['Working', 'Break', 'Smoking', 'Working', 'Loitering']
    },
    { 
      id: '4', 
      name: 'Sneha Gupta', 
      department: 'HR',
      dailyScore: 9.0, 
      weeklyScore: 8.6, 
      monthlyScore: 8.3,
      hoursWorked: '8h 05m',
      lastActive: '2026-04-28 14:28:33',
      snapshots: ['Working', 'Discussion', 'Working', 'Lunch', 'Working']
    },
    { 
      id: '5', 
      name: 'Vikram Mehta', 
      department: 'Operations',
      dailyScore: 7.5, 
      weeklyScore: 7.8, 
      monthlyScore: 7.6,
      hoursWorked: '7h 55m',
      lastActive: '2026-04-28 14:31:20',
      snapshots: ['Working', 'Working', 'Break', 'Discussion', 'Working']
    },
  ];

  const sortedWorkers = [...workers].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('desc');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-hive-success';
    if (score >= 6) return 'text-hive-warning';
    return 'text-hive-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-hive-success/20';
    if (score >= 6) return 'bg-hive-warning/20';
    return 'bg-hive-error/20';
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Worker Productivity section */}
        <div className="lg:col-span-2 glass p-6 border-white/5 rounded-lg">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Worker Productivity - Score out of 10
          </h3>
          
          {/* Score Summary Header */}
          <div className="grid grid-cols-4 gap-4 mb-6 pb-4 border-b border-white/10">
            <div 
              onClick={() => handleSort('name')} 
              className="text-center cursor-pointer hover:bg-white/5 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 group">
                 <span className={cn("transition-colors", sortBy === 'name' ? "text-white" : "group-hover:text-white")}>Employee</span>
              </div>
            </div>
            <div 
              onClick={() => handleSort('dailyScore')} 
              className="text-center cursor-pointer hover:bg-white/5 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 group">
                <Calendar className={cn("w-3 h-3 transition-colors", sortBy === 'dailyScore' ? "text-white" : "group-hover:text-white")} /> 
                <span className={cn("transition-colors", sortBy === 'dailyScore' ? "text-white" : "group-hover:text-white")}>Daily</span>
              </div>
            </div>
            <div 
              onClick={() => handleSort('weeklyScore')} 
              className="text-center cursor-pointer hover:bg-white/5 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 group">
                <Calendar className={cn("w-3 h-3 transition-colors", sortBy === 'weeklyScore' ? "text-white" : "group-hover:text-white")} /> 
                <span className={cn("transition-colors", sortBy === 'weeklyScore' ? "text-white" : "group-hover:text-white")}>Weekly</span>
              </div>
            </div>
            <div 
              onClick={() => handleSort('monthlyScore')} 
              className="text-center cursor-pointer hover:bg-white/5 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 group">
                <Calendar className={cn("w-3 h-3 transition-colors", sortBy === 'monthlyScore' ? "text-white" : "group-hover:text-white")} /> 
                <span className={cn("transition-colors", sortBy === 'monthlyScore' ? "text-white" : "group-hover:text-white")}>Monthly</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {sortedWorkers.map(worker => (
              <div key={worker.id}>
                <div 
                  onClick={() => setExpandedWorker(expandedWorker === worker.id ? null : worker.id)}
                  className={cn(
                    "flex justify-between items-center p-4 bg-white/5 rounded-lg cursor-pointer transition-all hover:bg-white/10",
                    expandedWorker === worker.id && "bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{worker.name}</div>
                      <div className="text-xs opacity-50">{worker.department}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Scores */}
                    <div className="flex items-center gap-4">
                      <div className={cn("text-sm font-mono font-bold", getScoreColor(worker.dailyScore))}>{worker.dailyScore}</div>
                      <div className={cn("text-sm font-mono font-bold", getScoreColor(worker.weeklyScore))}>{worker.weeklyScore}</div>
                      <div className={cn("text-sm font-mono font-bold", getScoreColor(worker.monthlyScore))}>{worker.monthlyScore}</div>
                    </div>

                    <ChevronRight className={cn(
                      "w-4 h-4 text-white/20 transition-transform",
                      expandedWorker === worker.id && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* Expanded View */}
                {expandedWorker === worker.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-4 bg-white/5 rounded border border-white/10 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                       <div>
                         <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Last Active</div>
                         <div className="text-xs font-mono">{worker.lastActive}</div>
                       </div>
                       <div className="text-right">
                         <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Hours Today</div>
                         <div className="text-xs font-mono text-hive-success">{worker.hoursWorked}</div>
                       </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {worker.snapshots.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-[2px] text-[8px] font-bold uppercase tracking-widest text-white/60">{s}</span>
                      ))}
                    </div>
                    
                    {/* Individual Reports */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-3">Individual Reports</div>
                      <div className="space-y-2">
                        <div className="p-3 bg-white/5 rounded border border-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-bold text-white/80">Shift Summary</span>
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Log</span>
                          </div>
                          <p className="text-[10px] text-white/50 italic">"Completed all tasks in Zone {worker.id === '1' ? 'A' : 'B'}. System stable."</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Employee Reports Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 border-white/5 rounded-lg h-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Recent Employee Reports
            </h3>
            
            <div className="space-y-4">
              {[
                { name: 'Rahul Sharma', time: '10m ago', msg: 'Completed Zone A tasks ahead of schedule. Moving to Zone B.', status: 'General' },
                { name: 'Priya Patel', time: '2h ago', msg: 'Camera feed in Zone C seems slightly blurry. Please check.', status: 'Issue' },
                { name: 'Amit Singh', time: '4h ago', msg: 'Daily log: All operational nodes synced.', status: 'Log' },
              ].map((report, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-lg group hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs font-bold">{report.name}</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-widest">{report.time}</div>
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold uppercase px-2 py-0.5 rounded",
                      report.status === 'Issue' ? "bg-hive-error/20 text-hive-error" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed italic">"{report.msg}"</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 py-1.5 bg-white/5 hover:bg-hive-success hover:text-black rounded text-[8px] font-bold uppercase tracking-widest transition-all">Resolve</button>
                    <button className="py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-widest transition-all">Details</button>
                  </div>
                </div>
              ))}
              
              <button className="w-full py-3 border border-white/5 hover:border-white/20 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all rounded mt-4">
                View All Reports
              </button>
            </div>
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
