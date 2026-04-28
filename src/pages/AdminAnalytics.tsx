import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Flame, Users, TrendingUp, AlertTriangle, Clock, MapPin, Zap, Activity } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';

export function AdminAnalytics() {
  const { theme } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const isLight = theme === 'light';

  // Productivity activities (Working, Eating, Discussing)
  const productivityData = [
    { activity: 'Working', count: 45, color: '#06B6D4' }, // Hive Cyan
    { activity: 'Eating', count: 8, color: '#10B981' },
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
    { name: 'Working', value: 45, color: '#06B6D4' }, // Primary Hive Cyan
    { name: 'Eating', value: 8, color: '#10B981' },
    { name: 'Discussing', value: 12, color: '#3B82F6' },
    { name: 'Talking', value: 15, color: '#8B5CF6' },
    { name: 'Smoking', value: 5, color: '#EF4444' },
    { name: 'Loitering', value: 7, color: '#64748B' },
  ];

  const stats = [
    { label: 'Avg Productivity', value: '88.4%', icon: Zap, color: 'text-hive-brand' },
    { label: 'Zone Density', value: 'OPTIMAL', icon: MapPin, color: 'text-blue-500' },
    { label: 'Active Alerts', value: '2', icon: AlertTriangle, color: 'text-hive-brand' },
    { label: 'System Load', value: '14%', icon: Activity, color: 'text-hive-text-40' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter text-hive-text">Operational Analytics</h1>
        <p className="text-hive-text-40 text-[10px] uppercase font-bold tracking-[0.2em]">High-fidelity productivity tracking and zone correlation</p>
      </header>

      {!selectedEmployee ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-hive-text-10 border border-hive-border p-6 rounded-lg glass">
                <div className="flex items-center gap-2 mb-2 text-hive-text-40">
                  <stat.icon className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{stat.label}</span>
                </div>
                <div className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Overall Distribution */}
            <div className="lg:col-span-2 glass p-8 rounded-lg space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-hive-brand" /> Global Activity Breakdown
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedProductivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isLight ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isLight ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)' }}
                      contentStyle={{ 
                        backgroundColor: isLight ? '#FFFFFF' : '#0A0A0A', 
                        borderRadius: '12px',
                        border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`, 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {combinedProductivity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="glass p-8 rounded-lg space-y-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50">Efficiency Index</h3>
              <div className="space-y-6">
                {[
                  { label: 'Work Focus', val: 92 },
                  { label: 'Collab Depth', val: 78 },
                  { label: 'Zone Stability', val: 85 }
                ].map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-hive-text-60">{m.label}</span>
                      <span className="text-hive-text">{m.val}%</span>
                    </div>
                    <div className="h-1.5 bg-hive-text-10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${m.val}%` }}
                         className={cn(
                           "h-full shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-hive-brand"
                         )}
                       />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-hive-border">
                 <div className="p-4 bg-hive-brand/10 border border-hive-brand/20 rounded-lg">
                    <div className="text-[10px] font-bold text-hive-accent uppercase tracking-widest mb-1">Recommendation</div>
                    <p className="text-[9px] text-hive-text-50 leading-relaxed uppercase">
                      Individual focus is high. Zone B capacity can be optimized by 12%.
                    </p>
                 </div>
              </div>
            </div>
          </div>

          {/* Combined Productivity & Zone Table */}
          <div className="glass p-8 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-hive-text-50 mb-8 flex items-center gap-2">
              <Users className="w-4 h-4 text-hive-brand" /> Personnel Productivity Intel
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hive-border">
                    <th className="text-left pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-hive-text-30 px-4">Employee</th>
                    <th className="text-left pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-hive-text-30 px-4">Active Zone</th>
                    <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-hive-brand px-4">Working (h)</th>
                    <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-hive-text-30 px-4">Non-Prod (h)</th>
                    <th className="text-center pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-hive-text-30 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hive-border">
                  {employeeData.map((emp, idx) => (
                    <tr key={idx} className="group hover:bg-hive-text-10 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-black text-hive-text-90">{emp.name}</div>
                        <div className="text-[8px] font-bold uppercase text-hive-text-30 tracking-widest">{emp.status}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-hive-text-10 border border-hive-border rounded text-[9px] font-bold text-hive-text-60">
                          {emp.zone}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-mono font-bold text-hive-brand">{emp.working}h</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-mono font-bold text-hive-text-20">
                          {(emp.talking + emp.smoking + emp.loitering).toFixed(1)}h
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => setSelectedEmployee(emp.name)}
                          className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-hive-accent text-hive-black rounded hover:bg-hive-success transition-all opacity-0 group-hover:opacity-100 shadow-md"
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
          <div className="flex items-center justify-between glass p-6 rounded-lg">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-lg bg-hive-brand/20 flex items-center justify-center border border-hive-brand/30">
                  <Users className="w-6 h-6 text-hive-brand" />
               </div>
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-hive-text">{selectedEmployee}</h2>
                 <p className="text-[10px] font-bold uppercase text-hive-text-40 tracking-widest">30-Day Intelligence Deep Dive</p>
               </div>
            </div>
            <button 
              onClick={() => setSelectedEmployee(null)}
              className="text-[10px] font-black uppercase tracking-widest px-6 py-3 border border-hive-border hover:border-hive-brand hover:text-hive-brand transition-all rounded shadow-sm text-hive-text"
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
