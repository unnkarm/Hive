import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';
import { Sparkles, Activity, ShieldCheck, Map } from 'lucide-react';

export function EmployeeDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Personalized Workspace</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">
            Welcome back,<br />
            <span className="text-white/40">{user.name}</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
          <div className="glass border-white/5 p-4 flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center rounded">
                <Activity className="w-5 h-5 text-emerald-400" />
             </div>
             <div>
                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Daily Goal</div>
                <div className="text-sm font-black">92% Met</div>
             </div>
          </div>
          <div className="glass border-white/5 p-4 flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
             </div>
             <div>
                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Sec Status</div>
                <div className="text-sm font-black">Verified</div>
             </div>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Map className="w-5 h-5 text-white/40" /> 30-Day Activity Intelligence
           </h2>
           <span className="text-[10px] font-mono text-white/30 uppercase">EMP ID: {user.id}</span>
        </div>
        
        {/* Render the analytics dashboard scoped to the logged in employee */}
        <EmployeeAnalyticsDashboard employeeId={user.id} name={user.name} />
      </section>

      <footer className="pt-12 text-center opacity-20">
         <p className="text-[9px] font-bold uppercase tracking-[0.5em]">ProductHive Intelligence Sync v1.0.4</p>
      </footer>
    </div>
  );
}
