import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

export function AdminAnalytics() {
  const activityData = [
    { activity: 'Working', count: 45 },
    { activity: 'Loitering', count: 12 },
    { activity: 'Eating', count: 8 },
    { activity: 'Talking', count: 15 },
    { activity: 'Smoking', count: 5 },
  ];

  return (
    <div className="p-8 space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Analytics</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Productivity and Zone Tracking</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-8">Zone Wise Working Tracker</h3>
          <div className="flex flex-col gap-4">
            {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map(zone => (
              <div key={zone} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <span className="font-bold">{zone}</span>
                <span className="text-hive-success">Active Employees: {Math.floor(Math.random() * 20) + 5}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-8">Activity Breakdown (Productive vs Non-Productive)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="activity" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', fontSize: '10px' }} 
                  itemStyle={{ color: '#FFF' }}
                />
                <Bar dataKey="count" fill="#FFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="glass p-6 border-white/5">
         <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-8">Heatmaps</h3>
         <div className="grid grid-cols-8 gap-2 w-full max-w-4xl mx-auto">
           {Array.from({ length: 32 }).map((_, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0.1 }}
               animate={{ 
                 opacity: [0.1, 0.5, 0.2, 0.8, 0.3][Math.floor(Math.random() * 5)],
                 backgroundColor: i % 7 === 0 ? '#ff3333' : i % 3 === 0 ? '#ffff33' : '#33ff33'
               }}
               transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', delay: i * 0.05 }}
               className="aspect-square border border-white/5 rounded"
             />
           ))}
         </div>
         <div className="mt-8 flex justify-between text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
            <span>Low Activity</span>
            <span>High Activity</span>
         </div>
      </div>
    </div>
  );
}
