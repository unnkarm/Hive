import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';
import { Sparkles, Activity, ShieldCheck, Map } from 'lucide-react';

export function EmployeeDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Dashboard Content */}
        <div className="flex-1 space-y-12">
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
            
            <EmployeeAnalyticsDashboard employeeId={user.id} name={user.name} />
          </section>

          <footer className="pt-12 text-center opacity-20">
             <p className="text-[9px] font-bold uppercase tracking-[0.5em]">ProductHive Intelligence Sync v1.0.4</p>
          </footer>
        </div>

        {/* Right Sidebar - Report Portal */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass border-white/5 p-6 sticky top-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-hive-success/20 flex items-center justify-center rounded border border-hive-success/30">
                <ShieldCheck className="w-4 h-4 text-hive-success" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Report Portal</h3>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Daily Log Message</label>
                <textarea 
                  placeholder="Enter your daily activity summary or report issues..."
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-hive-success outline-none transition-all min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Intensity Level</label>
                <div className="flex gap-2">
                  {['Low', 'Mid', 'High'].map(level => (
                    <button 
                      key={level}
                      type="button"
                      className="flex-1 py-2 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded hover:bg-hive-success transition-all shadow-lg"
              >
                Submit Daily Report
              </button>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-white/20">Previous Submissions</h4>
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="p-3 bg-white/5 border border-white/5 rounded">
                      <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest mb-1">
                        <span className="text-white/40">2{i} April 2026</span>
                        <span className="text-hive-success">Resolved</span>
                      </div>
                      <p className="text-[10px] text-white/60 line-clamp-1 italic">Completed all assigned tasks in Zone A...</p>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  );
}
