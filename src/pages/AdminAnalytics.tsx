import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Flame, Users, TrendingUp, AlertTriangle, Clock, MapPin, Zap, Activity } from 'lucide-react';

import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';

export function AdminAnalytics() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Productivity activities (Working, Eating, Discussing)
  const productivityData = [
    { activity: 'Working', count: 45, color: '#10B981' },
    { activity: 'Eating', count: 8, color: '#F59E0B' },
    { activity: 'Discussing', count: 12, color: '#3B82F6' },
  ];

  // Employee-specific data with Zone info merged
  const employeeData = [
    { name: 'Rahul Sharma', working: 6.5, eating: 1, discussing: 0.5, talking: 0.3, smoking: 0.1, loitering: 0.1, zone: 'Zone A', status: 'Working' },
    { name: 'Priya Patel', working: 7, eating: 0.8, discussing: 0.8, talking: 0.2, smoking: 0, loitering: 0.2, zone: 'Zone B', status: 'Working' },
    { name: 'Amit Singh', working: 5, eating: 1.2, discussing: 0.3, talking: 0.8, smoking: 0.4, loitering: 0.3, zone: 'Zone A', status: 'Break' },
    { name: 'Sneha Gupta', working: 6.8, eating: 0.9, discussing: 0.6, talking: 0.2, smoking: 0, loitering: 0.5, zone: 'Zone C', status: 'Working' },
    { name: 'Vikram Mehta', working: 5.5, eating: 1, discussing: 0.4, talking: 0.5, smoking: 0.3, loitering: 0.3, zone: 'Zone B', status: 'Meeting' },
  ];

  // Combined data for overall view
  const combinedProductivity = [
    { name: 'Working', value: 45, color: '#10B981' },
    { name: 'Eating', value: 8, color: '#F59E0B' },
    { name: 'Discussing', value: 12, color: '#3B82F6' },
    { name: 'Talking', value: 15, color: '#EF4444' },
    { name: 'Smoking', value: 5, color: '#8B5CF6' },
    { name: 'Loitering', value: 7, color: '#EC4899' },
  ];

  const stats = [
    { label: 'Avg Productivity', value: '88.4%', icon: Zap, color: 'text-hive-success' },
    { label: 'Zone Density', value: 'OPTIMAL', icon: MapPin, color: 'text-blue-400' },
    { label: 'Active Alerts', value: '2', icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'System Load', value: '14%', icon: Activity, color: 'text-white/40' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Operational Analytics</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">High-fidelity productivity tracking and zone correlation</p>
      </header>

      {!selectedEmployee ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-white/40">
                  <stat.icon className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{stat.label}</span>
                </div>
                <div className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Overall Distribution */}
            <div className="lg:col-span-2 glass p-8 border-white/5 rounded-lg space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Global Activity Breakdown
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedProductivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {combinedProductivity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="glass p-8 border-white/5 rounded-lg space-y-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Efficiency Index</h3>
              <div className="space-y-6">
                {[
                  { label: 'Work Focus', val: 92 },
                  { label: 'Collab Depth', val: 78 },
                  { label: 'Zone Stability', val: 85 }
                ].map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-white/60">{m.label}</span>
                      <span className="text-white">{m.val}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${m.val}%` }}
                         className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                       />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/5">
                 <div className="p-4 bg-hive-success/10 border border-hive-success/20 rounded">
                    <div className="text-[10px] font-bold text-hive-success uppercase tracking-widest mb-1">Recommendation</div>
                    <p className="text-[9px] text-white/50 leading-relaxed uppercase">
                      Individual focus is high. Zone B capacity can be optimized by 12%.
                    </p>
                 </div>
              </div>
            </div>
          </div>

          {/* Combined Productivity & Zone Table */}
          <div className="glass p-8 border-white/5 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-8 flex items-center gap-2">
              <Users className="w-4 h-4" /> Personnel Productivity Intel
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-4">Employee</th>
                    <th className="text-left pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-4">Active Zone</th>
                    <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-hive-success px-4">Working (h)</th>
                    <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-4">Non-Prod (h)</th>
                    <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employeeData.map((emp, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-black text-white/90">{emp.name}</div>
                        <div className="text-[8px] font-bold uppercase text-white/30 tracking-widest">{emp.status}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white/60">
                          {emp.zone}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-mono font-bold text-hive-success">{emp.working}h</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-mono font-bold text-white/20">
                          {(emp.talking + emp.smoking + emp.loitering).toFixed(1)}h
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => setSelectedEmployee(emp.name)}
                          className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-white text-black rounded hover:bg-hive-success transition-all opacity-0 group-hover:opacity-100"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white/5 p-6 rounded-lg border border-white/10">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-lg bg-hive-success/20 flex items-center justify-center border border-hive-success/30">
                  <Users className="w-6 h-6 text-hive-success" />
               </div>
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedEmployee}</h2>
                 <p className="text-[10px] font-bold uppercase text-white/40 tracking-widest">30-Day Intelligence Deep Dive</p>
               </div>
            </div>
            <button 
              onClick={() => setSelectedEmployee(null)}
              className="text-[10px] font-black uppercase tracking-widest px-6 py-3 border border-white/20 hover:bg-white hover:text-black transition-all rounded"
            >
              Back to Overview
            </button>
          </div>
          <EmployeeAnalyticsDashboard employeeId="1" name={selectedEmployee} />
        </div>
      )}
    </div>
  );
}
