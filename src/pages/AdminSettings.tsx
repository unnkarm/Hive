import { Shield, EyeOff, Database, BellRing } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function AdminSettings() {
  const [anonymization, setAnonymization] = useState(true);

  return (
    <div className="p-8 space-y-12 max-w-4xl">
      <header>
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">Core Protocols</h1>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">System Governance & Privacy Controls</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
          <Shield className="w-4 h-4" /> Privacy & Safety
        </h2>
        
        <div className="glass p-8 border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold uppercase tracking-wide">Stealth Mode (Anonymization)</h3>
              <p className="text-xs text-white/40 max-w-md">Scrub PII and biometric hashes instantly. All tracking will use pseudonymous IDs only.</p>
            </div>
            <button 
              onClick={() => setAnonymization(!anonymization)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-500",
                anonymization ? "bg-hive-success" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500",
                anonymization ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-4">
             <h3 className="font-bold uppercase tracking-wide">Data Retention Cycle</h3>
             <div className="grid grid-cols-4 gap-4">
               {['24 Hours', '7 Days', '30 Days', 'Custom'].map(period => (
                 <button key={period} className={cn(
                    "px-4 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all",
                    period === '7 Days' ? "bg-white text-black border-white" : "border-white/10 hover:border-white/40"
                 )}>
                   {period}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
          <BellRing className="w-4 h-4" /> Alert Boundaries
        </h2>
        <div className="glass p-8 border-white/5 grid grid-cols-1 gap-12">
           <div className="space-y-4">
             <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Inactivity Trigger</h3>
             <input type="range" className="w-full accent-white" />
             <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
                <span>0m</span>
                <span>Active: 15m</span>
                <span>60m</span>
             </div>
           </div>
        </div>
      </section>

      <div className="flex justify-end pt-8">
        <button className="px-10 py-4 bg-white/5 hover:bg-white text-white hover:text-black border border-white/20 text-xs font-bold uppercase tracking-[0.2em] transition-all">
          Deploy System Settings
        </button>
      </div>
    </div>
  );
}
