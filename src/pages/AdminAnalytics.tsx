import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Flame, Users, TrendingUp, AlertTriangle, Clock, MapPin } from 'lucide-react';

import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';

type ViewType = 'individual' | 'overall';

export function AdminAnalytics() {
  const [activeView, setActiveView] = useState<ViewType>('overall');
  const [activeTab, setActiveTab] = useState<'zones' | 'productivity'>('zones');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Zone-wise heat map data
  const zoneHeatmapData = [
    { zone: 'Zone A', x: 0, y: 0, intensity: 0.9 },
    { zone: 'Zone A', x: 1, y: 0, intensity: 0.7 },
    { zone: 'Zone A', x: 2, y: 0, intensity: 0.8 },
    { zone: 'Zone A', x: 3, y: 0, intensity: 0.5 },
    { zone: 'Zone B', x: 0, y: 1, intensity: 0.6 },
    { zone: 'Zone B', x: 1, y: 1, intensity: 0.95 },
    { zone: 'Zone B', x: 2, y: 1, intensity: 0.85 },
    { zone: 'Zone B', x: 3, y: 1, intensity: 0.4 },
    { zone: 'Zone C', x: 0, y: 2, intensity: 0.3 },
    { zone: 'Zone C', x: 1, y: 2, intensity: 0.2 },
    { zone: 'Zone C', x: 2, y: 2, intensity: 0.4 },
    { zone: 'Zone C', x: 3, y: 2, intensity: 0.1 },
    { zone: 'Zone D', x: 0, y: 3, intensity: 0.15 },
    { zone: 'Zone D', x: 1, y: 3, intensity: 0.1 },
    { zone: 'Zone D', x: 2, y: 3, intensity: 0.05 },
    { zone: 'Zone D', x: 3, y: 3, intensity: 0.08 },
  ];

  // Productivity activities (Working, Eating, Discussing)
  const productivityData = [
    { activity: 'Working', count: 45, color: '#10B981' },
    { activity: 'Eating', count: 8, color: '#F59E0B' },
    { activity: 'Discussing', count: 12, color: '#3B82F6' },
  ];

  // Non-productivity activities (Talking, Smoking, Loitering)
  const nonProductivityData = [
    { activity: 'Talking', count: 15, color: '#EF4444' },
    { activity: 'Smoking', count: 5, color: '#8B5CF6' },
    { activity: 'Loitering', count: 7, color: '#EC4899' },
  ];

  // Employee-specific data
  const employeeData = [
    { name: 'Rahul Sharma', working: 6.5, eating: 1, discussing: 0.5, talking: 0.3, smoking: 0.1, loitering: 0.1 },
    { name: 'Priya Patel', working: 7, eating: 0.8, discussing: 0.8, talking: 0.2, smoking: 0, loitering: 0.2 },
    { name: 'Amit Singh', working: 5, eating: 1.2, discussing: 0.3, talking: 0.8, smoking: 0.4, loitering: 0.3 },
    { name: 'Sneha Gupta', working: 6.8, eating: 0.9, discussing: 0.6, talking: 0.2, smoking: 0, loitering: 0.5 },
    { name: 'Vikram Mehta', working: 5.5, eating: 1, discussing: 0.4, talking: 0.5, smoking: 0.3, loitering: 0.3 },
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

  const getHeatColor = (intensity: number) => {
    if (intensity >= 0.8) return '#EF4444';
    if (intensity >= 0.6) return '#F59E0B';
    if (intensity >= 0.4) return '#10B981';
    if (intensity >= 0.2) return '#3B82F6';
    return '#1E3A5F';
  };

  return (
    <div className="p-8 space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Analytics</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Productivity and Zone Tracking with Heat Map</p>
      </header>

      {/* View Toggle */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveView('overall')}
          className={cn(
            "px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded",
            activeView === 'overall' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white"
          )}
        >
          <Users className="w-3 h-3 inline mr-2" /> Overall All Employees
        </button>
        <button 
          onClick={() => setActiveView('individual')}
          className={cn(
            "px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded",
            activeView === 'individual' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white"
          )}
        >
          <TrendingUp className="w-3 h-3 inline mr-2" /> Individual Employee
        </button>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('zones')}
          className={cn(
            "px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded",
            activeTab === 'zones' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white"
          )}
        >
          <MapPin className="w-3 h-3 inline mr-2" /> Zone Heat Map
        </button>
        <button 
          onClick={() => setActiveTab('productivity')}
          className={cn(
            "px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded",
            activeTab === 'productivity' ? "bg-white text-black border-white" : "border-white/20 text-white hover:border-white"
          )}
        >
          <Flame className="w-3 h-3 inline mr-2" /> Productivity Breakdown
        </button>
      </div>

      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Zone Heat Map */}
          <div className="glass p-6 border-white/5 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Zone-Wise Working Tracker (Heat Map)
            </h3>
            
            {/* Heat Map Grid */}
            <div className="relative overflow-hidden p-4 bg-black/40 rounded-lg border border-white/5">
              {/* Scanning Animation */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-hive-success/40 blur-[2px] z-20 pointer-events-none"
              />
              
              <div className="grid grid-cols-4 gap-4 relative z-10">
                {zoneHeatmapData.map((cell, i) => {
                  const color = getHeatColor(cell.intensity);
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05, zIndex: 30 }}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden border border-white/10 glass transition-all"
                      style={{ 
                        backgroundColor: `${color}15`,
                        boxShadow: cell.intensity > 0.6 ? `inset 0 0 20px ${color}20, 0 0 10px ${color}10` : 'none',
                        borderColor: `${color}30`
                      }}
                      title={`${cell.zone} - ${Math.round(cell.intensity * 100)}% activity`}
                    >
                      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }} />
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-widest relative z-10">{cell.zone.replace('Zone ', '')}</span>
                      <span className="text-[12px] font-black font-mono text-white relative z-10">{Math.round(cell.intensity * 100)}%</span>
                      
                      {/* Intensity Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                        <div className="h-full transition-all duration-1000" style={{ width: `${cell.intensity * 100}%`, backgroundColor: color }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-between text-[8px] font-bold uppercase tracking-[0.2em]">
              <span className="text-blue-400">Low Activity</span>
              <span className="text-green-400">Medium</span>
              <span className="text-amber-400">High</span>
              <span className="text-red-400">Very High</span>
            </div>
          </div>

          {/* Zone Employee Count */}
          <div className="glass p-6 border-white/5 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" /> Active Employees by Zone
            </h3>
            <div className="flex flex-col gap-4">
              {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map((zone, idx) => (
                <div key={zone} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHeatColor([0.9, 0.7, 0.3, 0.1][idx]) }} />
                    <span className="font-bold">{zone}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-hive-success">{Math.floor(Math.random() * 15) + 5} Active</span>
                    <span className="text-white/30">|</span>
                    <span className="text-white/60">{Math.floor(Math.random() * 10) + 2} Working</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'productivity' && (
        <div className="space-y-8">
          {activeView === 'overall' ? (
            <>
              {/* Overall Productivity vs Non-Productivity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Productivity Activities */}
                <div className="glass p-6 border-white/5 rounded-lg">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-hive-success mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Productivity Activities
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productivityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                        <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis dataKey="activity" type="category" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} width={80} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', fontSize: '10px' }} 
                          itemStyle={{ color: '#FFF' }}
                        />
                        <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {productivityData.map(item => (
                      <div key={item.activity} className="bg-white/5 p-2 rounded text-center">
                        <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}</div>
                        <div className="text-[8px] uppercase opacity-50">{item.activity}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-Productivity Activities */}
                <div className="glass p-6 border-white/5 rounded-lg">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-hive-error mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Non-Productivity Activities
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nonProductivityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                        <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis dataKey="activity" type="category" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} width={80} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', fontSize: '10px' }} 
                          itemStyle={{ color: '#FFF' }}
                        />
                        <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {nonProductivityData.map(item => (
                      <div key={item.activity} className="bg-white/5 p-2 rounded text-center">
                        <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}</div>
                        <div className="text-[8px] uppercase opacity-50">{item.activity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Combined Pie Chart */}
              <div className="glass p-6 border-white/5 rounded-lg">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">Overall Overview - Activity Distribution</h3>
                <div className="h-[300px] w-full flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={combinedProductivity}
                        cx="40%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {combinedProductivity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', fontSize: '10px' }}
                      />
                      <Legend 
                        verticalAlign="middle" 
                        align="right" 
                        layout="vertical"
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-bold uppercase text-white/80">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            /* Individual Employee View */
            <div className="space-y-8">
              {!selectedEmployee ? (
                <div className="glass p-6 border-white/5 rounded-lg">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">Select Employee for Deep Dive</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-[10px] font-bold uppercase tracking-widest text-white/50">Employee</th>
                          <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-hive-success">Working (h)</th>
                          <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-amber-400">Eating (h)</th>
                          <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-blue-400">Discussing (h)</th>
                          <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-red-400">Talking (h)</th>
                          <th className="text-center p-3 text-[10px] font-bold uppercase tracking-widest text-white/50">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeData.map((emp, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 group">
                            <td className="p-3 text-sm font-bold">{emp.name}</td>
                            <td className="p-3 text-center font-mono text-hive-success">{emp.working}</td>
                            <td className="p-3 text-center font-mono text-amber-400">{emp.eating}</td>
                            <td className="p-3 text-center font-mono text-blue-400">{emp.discussing}</td>
                            <td className="p-3 text-center font-mono text-red-400">{emp.talking}</td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => setSelectedEmployee(emp.name)}
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white text-black rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View Detailed Dashboard
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-hive-success/20 flex items-center justify-center border border-hive-success/30">
                          <Users className="w-5 h-5 text-hive-success" />
                       </div>
                       <div>
                         <h2 className="text-xl font-black uppercase tracking-tighter">{selectedEmployee}</h2>
                         <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest">Active Analytics Session</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedEmployee(null)}
                      className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-white/20 hover:bg-white hover:text-black transition-all rounded"
                    >
                      Back to List
                    </button>
                  </div>
                  <EmployeeAnalyticsDashboard employeeId="1" name={selectedEmployee} />
                </div>
              )}
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="bg-hive-success/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-hive-success">32.8h</div>
                  <div className="text-[8px] uppercase text-white/50">Total Working</div>
                </div>
                <div className="bg-amber-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-400">4.9h</div>
                  <div className="text-[8px] uppercase text-white/50">Total Eating</div>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">2.6h</div>
                  <div className="text-[8px] uppercase text-white/50">Total Discussing</div>
                </div>
                <div className="bg-red-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-400">2.0h</div>
                  <div className="text-[8px] uppercase text-white/50">Total Talking</div>
                </div>
                <div className="bg-pink-500/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-pink-400">1.4h</div>
                  <div className="text-[8px] uppercase text-white/50">Total Non-Productive</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
