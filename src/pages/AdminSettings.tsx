import { Shield, EyeOff, Database, BellRing, Monitor } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export function AdminSettings() {
  const { privacyMode, setPrivacyMode, theme, setTheme } = useAuth();

  return (
    <div className="p-8 space-y-12 max-w-4xl text-hive-text">
      <header>
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter text-hive-text">Core Protocols</h1>
        <p className="text-hive-text-40 text-[10px] uppercase font-bold tracking-[0.2em]">System Governance & Privacy Controls</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-hive-text-30 flex items-center gap-3">
          <Shield className="w-4 h-4" /> Privacy & Safety
        </h2>
        
        <div className="glass p-8 space-y-8 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold uppercase tracking-wide text-hive-text">Stealth Mode (Anonymization)</h3>
              <p className="text-xs text-hive-text-40 max-w-md">Scrub PII and biometric hashes instantly. All tracking will use pseudonymous IDs only.</p>
            </div>
            <button 
              onClick={() => setPrivacyMode(!privacyMode)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-500",
                privacyMode ? "bg-hive-success" : "bg-hive-text-10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-hive-text transition-all duration-500",
                privacyMode ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="h-px bg-hive-border" />

          <div className="space-y-4">
             <h3 className="font-bold uppercase tracking-wide text-hive-text">Data Retention Cycle</h3>
             <div className="grid grid-cols-4 gap-4">
               {['24 Hours', '7 Days', '30 Days', 'Custom'].map(period => (
                 <button key={period} className={cn(
                    "px-4 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all rounded shadow-sm",
                    period === '7 Days' ? "bg-hive-accent text-hive-black border-hive-accent" : "border-hive-border text-hive-text-40 hover:border-hive-text-60"
                 )}>
                   {period}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-hive-text-30 flex items-center gap-3">
          <Monitor className="w-4 h-4" /> Interface & Visuals
        </h2>
        <div className="glass p-8 space-y-8 rounded-lg">
           <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold uppercase tracking-wide text-hive-text">System Appearance</h3>
              <p className="text-xs text-hive-text-40 max-w-md">Select your preferred interface theme for the intelligence portal.</p>
            </div>
            <div className="flex bg-hive-text-10 p-1 rounded border border-hive-border">
              <button 
                onClick={() => setTheme('dark')}
                className={cn(
                  "px-6 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded",
                  theme === 'dark' ? "bg-hive-accent text-hive-black" : "text-hive-text-40 hover:text-hive-text"
                )}
              >
                Dark Mode
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={cn(
                  "px-6 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded",
                  theme === 'light' ? "bg-hive-accent text-hive-black shadow-lg" : "text-hive-text-40 hover:text-hive-text"
                )}
              >
                Light Mode
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-hive-text-30 flex items-center gap-3">
          <BellRing className="w-4 h-4" /> Alert Boundaries
        </h2>
        <div className="glass p-8 grid grid-cols-1 gap-12 rounded-lg">
           <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-hive-text-60">Inactivity Trigger</h3>
              <input type="range" className="w-full accent-hive-accent" />
              <div className="flex justify-between text-[10px] font-mono text-hive-text-30 uppercase tracking-widest">
                 <span>0m</span>
                 <span>Active: 15m</span>
                 <span>60m</span>
              </div>
           </div>
        </div>
      </section>

      <div className="flex justify-end pt-8">
        <button className="px-10 py-4 bg-hive-accent hover:bg-hive-success text-hive-black border border-hive-accent text-xs font-bold uppercase tracking-[0.2em] transition-all rounded-lg shadow-xl">
          Deploy System Settings
        </button>
      </div>
    </div>
  );
}
