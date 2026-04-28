import { motion, AnimatePresence } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Activity, AlertCircle, Eye, MonitorOff, TrendingUp, Zap, Clock, Calendar, ChevronRight, User, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { generateInsight } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export function AdminDashboard() {
  const { cameras, stats, alerts } = useAppSimulator();
  const { reports, resolveReport, theme } = useAuth();
  const [insight, setInsight] = useState('Analyzing current workplace trends...');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dailyHours' | 'weeklyHours' | 'monthlyHours' | 'name'>('dailyHours');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const isLight = theme === 'light';
  
  useEffect(() => {
    generateInsight(stats).then(setInsight);
  }, [stats.activeZones]); // Refresh insight when stats change significantly

  const formatHours = (decimalHours: number) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  // Worker efficiency data (Hours Worked)
  const workers = [
    { 
      id: 'EMP-A12', 
      name: 'Rahul Sharma', 
      department: 'Operations',
      dailyHours: 8.4, 
      weeklyHours: 42.5, 
      monthlyHours: 168.5,
      lastActive: '2026-04-28 14:45:22',
      snapshots: ['Working', 'Discussion', 'Working', 'Break', 'Working']
    },
    { 
      id: 'EMP-B07', 
      name: 'Priya Patel', 
      department: 'Engineering',
      dailyHours: 7.75, 
      weeklyHours: 38.3, 
      monthlyHours: 155.2,
      lastActive: '2026-04-28 14:30:12',
      snapshots: ['Working', 'Working', 'Meeting', 'Working', 'Discussion']
    },
    { 
      id: 'EMP-C09', 
      name: 'Amit Singh', 
      department: 'Finance',
      dailyHours: 6.2, 
      weeklyHours: 32.75, 
      monthlyHours: 130.0,
      lastActive: '2026-04-28 14:15:00',
      snapshots: ['Working', 'Break', 'Smoking', 'Working', 'Loitering']
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

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter text-hive-text">Dashboard</h1>
          <p className="text-hive-text-40 text-[10px] uppercase font-bold tracking-[0.2em]">Real-time operational intelligence</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-hive-text-30 uppercase tracking-[0.3em]">System Sync</div>
          <div className="text-lg font-mono text-hive-brand">100.0%</div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Zap} label="Active Zones" value={stats.activeZones.toString()} color="text-hive-text" />
        <KPICard icon={TrendingUp} label="Movement" value={`${stats.movementPercentage}%`} color="text-hive-success" />
        <KPICard icon={Activity} label="Idle Rate" value={`${stats.idlePercentage}%`} color="text-hive-brand" />
        <KPICard icon={AlertCircle} label="Active Alerts" value={stats.activeAlerts.toString()} color="text-hive-error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Worker Efficiency section */}
        <div className="lg:col-span-2 glass p-8 rounded-xl space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-hive-brand" /> Active Work Hours
          </h3>
          
          {/* OEI Summary Header */}
          <div className="grid grid-cols-4 gap-4 mb-6 pb-4 border-b border-hive-border">
            <div 
              onClick={() => handleSort('name')} 
              className="text-center cursor-pointer hover:bg-hive-text-10 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-hive-text-40 uppercase tracking-widest mb-1 group">
                 <span className={cn("transition-colors", sortBy === 'name' ? "text-hive-text font-black" : "group-hover:text-hive-text")}>Employee</span>
              </div>
            </div>
            <div 
              onClick={() => handleSort('dailyHours')} 
              className="text-center cursor-pointer hover:bg-hive-text-10 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-hive-text-40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 group">
                <Calendar className={cn("w-3 h-3 transition-colors", sortBy === 'dailyHours' ? "text-hive-brand" : "group-hover:text-hive-brand")} /> 
                <span className={cn("transition-colors", sortBy === 'dailyHours' ? "text-hive-text font-black" : "group-hover:text-hive-text font-bold")}>Daily</span>
              </div>
            </div>
            <div 
              onClick={() => handleSort('weeklyHours')} 
              className="text-center cursor-pointer hover:bg-hive-text-10 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-hive-text-40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 group">
                <Calendar className={cn("w-3 h-3 transition-colors", sortBy === 'weeklyHours' ? "text-hive-brand" : "group-hover:text-hive-brand")} /> 
                <span className={cn("transition-colors", sortBy === 'weeklyHours' ? "text-hive-text font-black" : "group-hover:text-hive-text font-bold")}>Weekly</span>
              </div>
            </div>
            <div 
              onClick={() => handleSort('monthlyHours')} 
              className="text-center cursor-pointer hover:bg-hive-text-10 transition-colors p-2 rounded"
            >
              <div className="text-[10px] text-hive-text-40 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 group">
                <Calendar className={cn("w-3 h-3 transition-colors", sortBy === 'monthlyHours' ? "text-hive-brand" : "group-hover:text-hive-brand")} /> 
                <span className={cn("transition-colors", sortBy === 'monthlyHours' ? "text-hive-text font-black" : "group-hover:text-hive-text font-bold")}>Monthly</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {sortedWorkers.map(worker => (
              <div key={worker.id}>
                <div 
                  onClick={() => setExpandedWorker(expandedWorker === worker.id ? null : worker.id)}
                  className={cn(
                    "flex justify-between items-center p-4 glass rounded-lg cursor-pointer transition-all hover:bg-hive-text-10 group/card",
                    expandedWorker === worker.id && "bg-hive-text-10 ring-1 ring-hive-brand/20"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-hive-text-10 rounded-full flex items-center justify-center group-hover/card:bg-hive-brand/10 transition-colors">
                      <User className="w-5 h-5 text-hive-text-60 group-hover/card:text-hive-brand transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-hive-text group-hover/card:text-hive-brand transition-colors">{worker.name}</div>
                      <div className="text-[10px] uppercase font-bold text-hive-text-40 tracking-widest">{worker.department}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Active Work Hours */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-mono font-black w-16 text-center text-hive-text">{formatHours(worker.dailyHours)}</div>
                      <div className="text-sm font-mono font-black w-16 text-center text-hive-text">{formatHours(worker.weeklyHours)}</div>
                      <div className="text-sm font-mono font-black w-16 text-center text-hive-text">{formatHours(worker.monthlyHours)}</div>
                    </div>

                    <ChevronRight className={cn(
                      "w-4 h-4 text-hive-text-20 transition-transform",
                      expandedWorker === worker.id && "rotate-90 text-hive-brand"
                    )} />
                  </div>
                </div>

                {/* Expanded View */}
                <AnimatePresence>
                  {expandedWorker === worker.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-6 glass rounded-lg space-y-4 border-l-2 border-hive-brand">
                        <div className="flex justify-between items-start">
                           <div>
                             <div className="text-[10px] text-hive-text-40 uppercase tracking-widest mb-1 font-bold">Last Active Snapshot</div>
                             <div className="text-xs font-mono text-hive-text-90">{worker.lastActive}</div>
                           </div>
                           <div className="text-right">
                             <div className="text-[10px] text-hive-text-40 uppercase tracking-widest mb-1 font-bold">Active Utilization (Daily)</div>
                             <div className="text-xs font-mono text-hive-success font-black">{formatHours(worker.dailyHours)}</div>
                           </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {worker.snapshots.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 glass rounded-[2px] text-[8px] font-black uppercase tracking-widest text-hive-text-60 bg-hive-text-5">{s}</span>
                          ))}
                        </div>
                        
                        {/* Individual Reports */}
                        <div className="pt-4 border-t border-hive-border">
                          <div className="text-[9px] font-black uppercase tracking-widest text-hive-text-40 mb-3 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Individual Reports
                          </div>
                          <div className="space-y-2">
                            {reports.filter(r => r.issuerId === worker.id).length > 0 ? (
                              reports.filter(r => r.issuerId === worker.id).map(report => (
                                <div key={report.id} className="p-3 glass rounded bg-hive-text-5">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] font-black text-hive-text-90">{report.status} Log</span>
                                    <span className={cn(
                                      "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest",
                                      report.isResolved ? "bg-hive-success/20 text-hive-success" : "bg-hive-brand/20 text-hive-brand"
                                    )}>{report.isResolved ? 'Resolved' : 'Pending'}</span>
                                  </div>
                                  <p className="text-[10px] text-hive-text-50 italic">"{report.message}"</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-[9px] text-hive-text-20 uppercase italic text-center py-2">No logged reports for this session.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Reports Sidebar */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-xl h-full overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-hive-brand" /> Recent Employee Reports
            </h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {reports.map((report) => (
                  <motion.div 
                    layout
                    key={report.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "p-4 glass rounded-lg group transition-all",
                      report.isResolved ? "opacity-40" : "hover:border-hive-brand/40 border-transparent border"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs font-black text-hive-text">{report.issuerName}</div>
                        <div className="text-[8px] text-hive-text-40 uppercase tracking-widest font-bold">{report.timestamp}</div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest",
                        report.status === 'Issue' ? "bg-hive-error/20 text-hive-error" : "bg-blue-500/20 text-blue-400"
                      )}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-hive-text-60 leading-relaxed italic">"{report.message}"</p>
                    
                    {!report.isResolved && (
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => resolveReport(report.id)}
                          className="flex-1 py-1.5 bg-hive-brand text-hive-black hover:bg-hive-success rounded text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Resolve
                        </button>
                        <button className="py-1.5 px-3 glass hover:bg-hive-text-10 rounded text-[8px] font-black uppercase tracking-widest transition-all text-hive-text-60">Details</button>
                      </div>
                    )}
                    {report.isResolved && (
                      <div className="mt-2 text-[8px] font-black text-hive-success uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Resolved by Admin
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <button className="w-full py-3 glass hover:bg-hive-text-10 text-[9px] font-black uppercase tracking-widest text-hive-text-40 hover:text-hive-text transition-all rounded mt-4 shrink-0">
              View All History
            </button>
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
      className="glass p-6 flex flex-col items-start gap-1 group relative overflow-hidden rounded-xl"
    >
      <div className="absolute top-2 right-2 text-hive-text-10 group-hover:text-hive-brand/20 transition-colors">
        <Icon className="w-12 h-12 rotate-[-15deg]" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-hive-text-40">{label}</span>
      <span className={cn("text-3xl font-black tracking-tighter", color)}>{value}</span>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-hive-brand/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </motion.div>
  );
}
