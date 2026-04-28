import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { EmployeeAnalyticsDashboard } from '../components/EmployeeAnalyticsDashboard';
import { Sparkles, Activity, ShieldCheck, Map, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export function EmployeeDashboard() {
  const { user, reports, addReport } = useAuth();
  const [message, setMessage] = useState('');
  const [intensity, setIntensity] = useState<'Low' | 'Mid' | 'High'>('Low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!user) return null;

  const userReports = reports.filter(r => r.issuerId === user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    // Simulate network delay
    setTimeout(() => {
      addReport(message, intensity);
      setMessage('');
      setIntensity('Low');
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

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
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-hive-text">
                Welcome back,<br />
                <span className="text-hive-text-40">{user.name}</span>
              </h1>
            </div>
            
            <div className="flex gap-4">
              <div className="glass p-4 flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center rounded">
                    <Activity className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div>
                    <div className="text-[9px] font-bold text-hive-text-40 uppercase tracking-widest">Daily Goal</div>
                    <div className="text-sm font-black text-hive-text">92% Met</div>
                 </div>
              </div>
              <div className="glass p-4 flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                 </div>
                 <div>
                    <div className="text-[9px] font-bold text-hive-text-40 uppercase tracking-widest">Sec Status</div>
                    <div className="text-sm font-black text-hive-text">Verified</div>
                 </div>
              </div>
            </div>
          </header>

          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-hive-border pb-4">
               <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-3 text-hive-text">
                  <Map className="w-5 h-5 text-hive-text-40" /> 30-Day Activity Intelligence
               </h2>
               <span className="text-[10px] font-mono text-hive-text-30 uppercase">EMP ID: {user.id}</span>
            </div>
            
            <EmployeeAnalyticsDashboard employeeId={user.id} name={user.name} />
          </section>

          <footer className="pt-12 text-center opacity-20">
             <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-hive-text">ProductHive Intelligence Sync v1.0.4</p>
          </footer>
        </div>

        {/* Right Sidebar - Report Portal */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass p-6 sticky top-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-hive-success/20 flex items-center justify-center rounded border border-hive-success/30">
                <ShieldCheck className="w-4 h-4 text-hive-success" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-hive-text">Report Portal</h3>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Daily Log Message</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your daily activity summary or report issues..."
                  className="w-full bg-hive-input-bg border border-hive-border rounded p-3 text-sm focus:border-hive-success outline-none transition-all min-h-[120px] resize-none text-hive-text"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-hive-text-40">Intensity Level</label>
                <div className="flex gap-2">
                  {(['Low', 'Mid', 'High'] as const).map(level => (
                    <button 
                      key={level}
                      type="button"
                      onClick={() => setIntensity(level)}
                      className={cn(
                        "flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all border",
                        intensity === level 
                          ? "bg-hive-accent text-hive-black border-hive-accent shadow-sm" 
                          : "bg-hive-text-10 border-hive-border text-hive-text-40 hover:bg-hive-text-20"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <button 
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className={cn(
                    "w-full py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded transition-all shadow-lg flex items-center justify-center gap-2",
                    isSubmitting || !message.trim()
                      ? "bg-hive-text-10 text-hive-text-20 cursor-not-allowed"
                      : "bg-hive-accent text-hive-black hover:bg-hive-success"
                  )}
                >
                  {isSubmitting ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    'Submit Daily Report'
                  )}
                </button>
                
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -bottom-10 left-0 right-0 text-center text-hive-success text-[10px] font-bold uppercase tracking-widest"
                    >
                      Report Logged Successfully
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 border-t border-hive-border space-y-4">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-hive-text-20">Previous Submissions</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {userReports.length > 0 ? (
                    userReports.map(report => (
                      <div key={report.id} className="p-3 glass rounded">
                        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest mb-1">
                          <span className="text-hive-text-40 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {report.timestamp}</span>
                          <span className={cn(report.isResolved ? "text-hive-success" : "text-amber-400")}>
                            {report.isResolved ? 'Resolved' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[10px] text-hive-text-60 line-clamp-2 italic">"{report.message}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[9px] text-hive-text-20 uppercase tracking-widest text-center py-4">No recent submissions</div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  );
}
