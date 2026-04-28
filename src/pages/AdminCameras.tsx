import { useState } from 'react';
import { motion } from 'motion/react';
import { useAppSimulator } from '../hooks';
import { Camera, Signal, Activity, Info, MoreVertical, Target, Clock, User, Calendar, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { LiveTrackingPortal } from './LiveTrackingPortal';

export function AdminCameras() {
  const { cameras } = useAppSimulator();
  const [activeTab, setActiveTab] = useState<'live' | 'general' | 'overview'>('general');
  const [liveFilter, setLiveFilter] = useState<'person' | 'zone' | 'all'>('all');


  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Cameras</h1>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Multi-stream ingestion grid</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('live')}
            className={cn("px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded", activeTab === 'live' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white")}
          >
            Live Tracking
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn("px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded", activeTab === 'overview' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white")}
          >
            Overview Footage
          </button>
          <button 
            onClick={() => setActiveTab('general')}
            className={cn("px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded", activeTab === 'general' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white")}
          >
            Camera Grid
          </button>
        </div>
      </header>

      {activeTab === 'general' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cameras.map((cam) => (
            <CameraTile key={cam.id} camera={cam} />
          ))}
        </div>
      ) : activeTab === 'live' ? (
        <div className="flex flex-col gap-6">
          {/* Live Tracking Sub-Options */}
          <div className="flex gap-4">
            {[
              { id: 'person', label: '1. Individual Person', icon: User },
              { id: 'zone', label: '2. Zone Wise', icon: Target },
              { id: 'all', label: '3. All Cameras', icon: Eye }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLiveFilter(opt.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 transition-all rounded text-[9px] font-bold uppercase tracking-widest",
                  liveFilter === opt.id 
                    ? "bg-white text-black border border-white" 
                    : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30"
                )}
              >
                <opt.icon className={cn("w-3 h-3", liveFilter === opt.id ? "text-black" : "text-hive-success")} /> {opt.label}
              </button>
            ))}
          </div>
          
          <div className="glass p-8 border-white/5 flex flex-col w-full h-full min-h-[600px]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-hive-success animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Feed: {liveFilter === 'person' ? 'Target Focus' : liveFilter === 'zone' ? 'Zone Analysis' : 'Master Grid'}</span>
              </div>
            </div>
            <LiveTrackingPortal mode={liveFilter} />
          </div>
        </div>

      ) : (
        <OverviewFootage />
      )}

    </div>
  );
}

function OverviewFootage() {
  const employees = [
    { id: 'EMP-001', name: 'Rahul Sharma', department: 'Operations', status: 'Active', lastActive: '2026-04-28 14:32:45', hoursWorked: '8h 23m' },
    { id: 'EMP-002', name: 'Priya Patel', department: 'Engineering', status: 'Active', lastActive: '2026-04-28 14:30:12', hoursWorked: '7h 45m' },
    { id: 'EMP-003', name: 'Amit Singh', department: 'Finance', status: 'Break', lastActive: '2026-04-28 14:15:00', hoursWorked: '6h 12m' },
    { id: 'EMP-004', name: 'Sneha Gupta', department: 'HR', status: 'Active', lastActive: '2026-04-28 14:28:33', hoursWorked: '8h 05m' },
    { id: 'EMP-005', name: 'Vikram Mehta', department: 'Operations', status: 'Active', lastActive: '2026-04-28 14:31:20', hoursWorked: '7h 55m' },
  ];

  // Generate 30 days of snapshots
  const generateSnapshots = () => {
    const snapshots = [];
    const activities = ['Working', 'Meeting', 'Break', 'Lunch', 'Discussion'];
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      snapshots.push({
        date: date.toISOString().split('T')[0],
        activity: activities[Math.floor(Math.random() * activities.length)],
        timestamp: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
      });
    }
    return snapshots;
  };

  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
  const snapshots = generateSnapshots();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Employee List */}
      <div className="glass border-white/5 p-6 rounded-lg">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
          <User className="w-4 h-4" /> Registered Employees
        </h3>
        <div className="space-y-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className={cn(
                "p-4 border cursor-pointer transition-all rounded-lg",
                selectedEmployee.id === emp.id 
                  ? "bg-white/10 border-white/30" 
                  : "border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold">{emp.name}</span>
                <span className={cn(
                  "text-[8px] font-bold uppercase px-2 py-0.5 rounded",
                  emp.status === 'Active' ? "bg-hive-success/20 text-hive-success" : "bg-hive-warning/20 text-hive-warning"
                )}>
                  {emp.status}
                </span>
              </div>
              <div className="text-[10px] opacity-50">{emp.department}</div>
              <div className="text-[9px] opacity-30 mt-2 font-mono">{emp.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass border-white/5 p-6 rounded-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tighter">{selectedEmployee.name}</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{selectedEmployee.id} // {selectedEmployee.department}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Hours Worked Today</div>
              <div className="text-2xl font-bold text-hive-success">{selectedEmployee.hoursWorked}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Last Active</div>
              <div className="text-sm font-mono">{selectedEmployee.lastActive}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Status</div>
              <div className={cn(
                "text-sm font-bold uppercase",
                selectedEmployee.status === 'Active' ? "text-hive-success" : "text-hive-warning"
              )}>{selectedEmployee.status}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Department</div>
              <div className="text-sm font-bold">{selectedEmployee.department}</div>
            </div>
          </div>
        </div>

        {/* 30-Day Snapshots */}
        <div className="glass border-white/5 p-6 rounded-lg">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Last 30 Days Activity Snapshots
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {snapshots.slice(0, 25).map((snap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="aspect-square bg-white/5 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                title={`${snap.date} - ${snap.activity} at ${snap.timestamp}`}
              >
                <div className="w-8 h-8 bg-white/10 rounded-full mb-2 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white/40" />
                </div>
                <div className="text-[7px] text-white/40 font-mono">{snap.date.slice(5)}</div>
                <div className="text-[8px] text-white/60 font-bold uppercase">{snap.activity}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest">
              View All 30 Days →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraTile({ camera }: any) {
  const isOnline = camera.status === 'Online';
  const activityColor = {
    'High': 'text-hive-error',
    'Medium': 'text-hive-warning',
    'Low': 'text-hive-success',
    'Idle': 'text-white/40',
    'Break': 'text-white/20'
  }[camera.activity as string] || 'text-white/40';

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="glass border-white/5 flex flex-col group"
    >
      <div className="aspect-video relative overflow-hidden bg-hive-black">
        {isOnline ? (
          <img 
            src={`https://picsum.photos/seed/${camera.id}/600/400?grayscale`} 
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[3s]" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
            <Signal className="w-8 h-8 mb-2" />
            <span className="text-[10px] uppercase tracking-widest text-white/40">Signal Lost</span>
          </div>
        )}
        
        {/* Overlay Labels */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="bg-black/80 px-2 py-1 rounded border border-white/10 flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOnline ? "bg-hive-success" : "bg-hive-error")} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{camera.name}</span>
            </div>
            <div className="bg-black/80 px-2 py-1 rounded border border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{camera.zone}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm p-2 -mx-4 -mb-4 border-t border-white/10">
             <div className="flex items-center gap-2">
               <Activity className={cn("w-3 h-3", activityColor)} />
               <span className={cn("text-[9px] font-bold uppercase tracking-widest", activityColor)}>{camera.activity}</span>
             </div>
             <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">Conf: {camera.confidence}%</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-hive-dark/50 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest border-t border-white/5">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 opacity-40"><Signal className="w-3 h-3" /> Latency: {camera.latency.toFixed(0)}ms</span>
          <span className="flex items-center gap-1 opacity-40"><Info className="w-3 h-3" /> Health: {camera.health}%</span>
        </div>
        <button className="p-1 hover:bg-white/10 transition-colors">
          <MoreVertical className="w-4 h-4 opacity-40" />
        </button>
      </div>
    </motion.div>
  );
}
