import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Monitor, ShieldCheck, Zap, Layers } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useAuth();
  const isLight = theme === 'light';

  return (
    <div className="relative bg-hive-black transition-all duration-500 min-h-screen">
      {/* Background Graphic */}
      <div className="fixed inset-0 technical-grid opacity-20 pointer-events-none" />
      
      
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center pt-32 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/producthive_landing_hero_1776928107298.png" 
            className={cn(
              "w-full h-full object-cover transition-opacity duration-1000",
              isLight ? "opacity-15 grayscale" : "opacity-30 grayscale brightness-50"
            )}
            alt="ProductHive Hero"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-hive-brand animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-hive-brand">Operational Intelligence v1.2</span>
          </motion.div>

          <motion.h1 
            className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8 text-hive-text"
          >
            See Workplace Activity.<br />
            <span className="text-hive-brand">In Real Time.</span>
          </motion.h1>
          <p className="text-lg md:text-xl text-hive-text-60 mb-10 tracking-widest uppercase max-w-2xl mx-auto font-medium">
            Turn multi-camera data into clear, actionable workforce insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-hive-accent text-hive-black font-black uppercase tracking-[0.2em] hover:bg-hive-success hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl rounded-sm text-xs"
            >
              View Live Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-10 py-5 border-2 border-hive-accent text-hive-text font-black uppercase tracking-[0.2em] hover:bg-hive-accent hover:text-hive-black transition-all rounded-sm text-xs">
              Get Started
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 animate-bounce text-hive-brand" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-8 border-y border-hive-border glass relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Latency', value: '<50ms' },
            { label: 'Accuracy', value: '99.4%' },
            { label: 'Zones', value: '∞' },
            { label: 'Privacy', value: 'SECURE' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="text-5xl font-black tracking-tighter mb-2 text-hive-text group-hover:text-hive-brand transition-colors">{stat.value}</div>
              <div className="text-[10px] uppercase font-black tracking-[0.3em] text-hive-text-40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-32 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 flex items-end justify-between">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 text-hive-text">
                Platform Core <br /><span className="text-hive-brand">Features</span>
              </h2>
              <p className="text-hive-text-40 text-sm tracking-widest uppercase">Autonomous coordination for industrial nodes.</p>
            </div>
            <div className="w-24 h-1 bg-hive-brand hidden md:block" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Monitor, title: 'Multi-Stream Visibility', desc: 'Sync dozens of streams into a unified operational view.' },
              { icon: Zap, title: 'Real-Time Insights', desc: 'Instant classification of workplace activity levels.' },
              { icon: Layers, title: 'Zone Intelligence', desc: 'Track movement flow across custom-defined areas.' },
              { icon: ShieldCheck, title: 'Smart Alerts', desc: 'Automated notification for crowding or inactivity spikes.' },
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 glass hover:border-hive-brand/40 transition-all rounded-xl"
              >
                <div className="w-14 h-14 border border-hive-border flex items-center justify-center mb-8 group-hover:bg-hive-brand group-hover:text-hive-black transition-all text-hive-brand rounded-lg shadow-lg">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider mb-4 text-hive-text group-hover:text-hive-brand transition-colors">{f.title}</h3>
                <p className="text-hive-text-40 text-xs leading-relaxed uppercase tracking-wider font-bold">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Visual Section Placeholder */}
      <section className="h-[60vh] relative overflow-hidden flex items-center justify-center px-8 border-y border-hive-border bg-hive-dark/30">
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 opacity-5 flex items-center justify-center"
         >
           <div className="w-[800px] h-[800px] border border-hive-brand rounded-full" />
           <div className="w-[600px] h-[600px] border border-hive-brand rounded-full absolute" />
           <div className="w-[400px] h-[400px] border border-hive-brand rounded-full absolute" />
         </motion.div>
         <div className="relative text-center max-w-2xl">
           <div className="w-12 h-1 bg-hive-brand mx-auto mb-8" />
           <h2 className="text-3xl font-black uppercase tracking-[0.2em] mb-6 text-hive-text">Built for the next frontier of workspace coordination.</h2>
           <p className="text-[10px] text-hive-brand font-black tracking-[0.3em] uppercase">Optimizing movement. Enhancing safety. Privately.</p>
         </div>
      </section>

      <footer className="py-32 px-8 border-t border-hive-border relative z-10 bg-hive-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10 text-hive-brand" />
              <span className="text-2xl font-black uppercase tracking-tighter text-hive-text">ProductHive</span>
            </div>
            <p className="text-hive-text-40 text-[10px] max-w-xs tracking-[0.2em] uppercase leading-loose font-bold">
              Workforce Intelligence platform by Hive Dynamics. <br />All rights reserved © 2026.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-24">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-hive-brand">Company</h4>
              <nav className="flex flex-col gap-3">
                <a href="#" className="text-xs text-hive-text-60 hover:text-hive-brand transition-colors font-bold uppercase tracking-widest">About</a>
                <a href="#" className="text-xs text-hive-text-60 hover:text-hive-brand transition-colors font-bold uppercase tracking-widest">Contact</a>
                <a href="#" className="text-xs text-hive-text-60 hover:text-hive-brand transition-colors font-bold uppercase tracking-widest">Privacy</a>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-hive-brand">Portal</h4>
              <nav className="flex flex-col gap-3">
                <Link to="/login" className="text-xs text-hive-text-60 hover:text-hive-brand transition-colors font-bold uppercase tracking-widest">Login</Link>
                <a href="#" className="text-xs text-hive-text-60 hover:text-hive-brand transition-colors font-bold uppercase tracking-widest">Status</a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
