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

      {/* Worker Productivity section with daily/weekly/monthly scores */}
      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="glass p-6 border-white/5 rounded-lg">
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
                    {/* Daily Score */}
                    <div className="text-center">
                      <div className={cn("text-lg font-bold font-mono", getScoreColor(worker.dailyScore))}>
                        {worker.dailyScore}
                      </div>
                      <div className="text-[8px] opacity-30 uppercase">/10</div>
                    </div>
                    
                    {/* Weekly Score */}
                    <div className="text-center">
                      <div className={cn("text-lg font-bold font-mono", getScoreColor(worker.weeklyScore))}>
                        {worker.weeklyScore}
                      </div>
                      <div className="text-[8px] opacity-30 uppercase">/10</div>
                    </div>
                    
                    {/* Monthly Score */}
                    <div className="text-center">
                      <div className={cn("text-lg font-bold font-mono", getScoreColor(worker.monthlyScore))}>
                        {worker.monthlyScore}
                      </div>
                      <div className="text-[8px] opacity-30 uppercase">/10</div>
                    </div>

                    {/* Hours Worked */}
                    <div className="text-center min-w-[80px]">
                      <div className="flex items-center gap-1 text-sm font-mono text-white/80">
                        <Clock className="w-3 h-3" /> {worker.hoursWorked}
                      </div>
                      <div className="text-[8px] opacity-30 uppercase">Hours Today</div>
                    </div>

                    <ChevronRight className={cn(
                      "w-5 h-5 text-white/40 transition-transform",
                      expandedWorker === worker.id && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* Expanded Detailed Overview */}
                {expandedWorker === worker.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {/* Employee Info */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Employee Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="bg-white/5 p-3 rounded">
                            <div className="text-white/40 mb-1">Employee ID</div>
                            <div className="font-mono">EMP-{worker.id.padStart(3, '0')}</div>
                          </div>
                          <div className="bg-white/5 p-3 rounded">
                            <div className="text-white/40 mb-1">Department</div>
                            <div className="font-bold">{worker.department}</div>
                          </div>
                          <div className="bg-white/5 p-3 rounded col-span-2">
                            <div className="text-white/40 mb-1">Last Active</div>
                            <div className="font-mono">{worker.lastActive}</div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity Snapshots */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Recent Activity Snapshots</h4>
                        <div className="flex gap-2 flex-wrap">
                          {worker.snapshots.map((activity, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "px-3 py-1 rounded text-[9px] font-bold uppercase",
                                activity === 'Working' ? 'bg-hive-success/20 text-hive-success' :
                                activity === 'Discussion' ? 'bg-blue-500/20 text-blue-400' :
                                activity === 'Meeting' ? 'bg-purple-500/20 text-purple-400' :
                                activity === 'Break' || activity === 'Lunch' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-hive-error/20 text-hive-error'
                              )}
                            >
                              {activity}
                            </div>
                          ))}
                        </div>
                        <div className="text-[9px] text-white/40 mt-2">
                          Last 5 activities recorded at timestamps
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
