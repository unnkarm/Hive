import { useAppSimulator } from '../hooks';
import { AlertTriangle, Clock, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AdminAlerts() {
  const { alerts, setAlerts } = useAppSimulator();

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Signal Breaches</h1>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Active & Resolved Anomalies</p>
        </div>
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div 
              layout
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "glass border-l-4 p-6 transition-all",
                alert.status === 'Resolved' 
                  ? "border-l-white/10 opacity-60" 
                  : alert.severity === 'High' ? "border-l-hive-error" : "border-l-hive-warning"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 flex items-center justify-center",
                    alert.status === 'Resolved' ? "bg-white/5" : "bg-white/10"
                  )}>
                    {alert.severity === 'High' ? <ShieldAlert className="w-6 h-6 text-hive-error" /> : <AlertTriangle className="w-6 h-6 text-hive-warning" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold tracking-tight uppercase">{alert.type}</h3>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest",
                        alert.severity === 'High' ? "bg-hive-error text-white" : "bg-hive-warning text-black"
                      )}>
                        {alert.severity} Priority
                      </span>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                       <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.zone}</span>
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {alert.status === 'Active' ? (
                    <button 
                      onClick={() => resolveAlert(alert.id)}
                      className="px-6 py-2 bg-white text-black text-[10px] font-extrabold uppercase tracking-widest hover:invert transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-hive-success text-[10px] font-bold uppercase tracking-widest">
                       <CheckCircle2 className="w-4 h-4" /> Resolved
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
