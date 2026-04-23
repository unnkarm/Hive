import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Monitor, ShieldCheck, Zap, Layers } from 'lucide-react';
import { Logo } from '../components/Logo';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Background Graphic */}
      <div className="fixed inset-0 technical-grid opacity-20 pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center pt-32 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/producthive_landing_hero_1776928107298.png" 
            className="w-full h-full object-cover opacity-30 grayscale brightness-50"
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
          <motion.h1 
            className="text-6xl md:text-8xl font-extrabold uppercase tracking-tighter leading-[0.9] mb-8 mt-48"
          >
            See Workplace Activity.<br />
            <span className="text-white/40">In Real Time.</span>
          </motion.h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 tracking-widest uppercase max-w-2xl mx-auto">
            Turn multi-camera data into clear, actionable workforce insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => navigate('/admin')}
              className="px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              View Live Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-10 py-4 border border-white text-white font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
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
          <ChevronDown className="w-6 h-6 animate-bounce opacity-40" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-8 border-y border-hive-border bg-hive-dark/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Latency', value: '<50ms' },
            { label: 'Accuracy', value: '99.4%' },
            { label: 'Zones', value: 'Unlimited' },
            { label: 'Privacy', value: '100% Secure' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold tracking-tighter mb-1">{stat.value}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24">
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-none mb-6">
              Platform Core Features
            </h2>
            <div className="w-24 h-1 bg-white" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Monitor, title: 'Multi-Camera Visibility', desc: 'Sync dozens of streams into a unified operational view.' },
              { icon: Zap, title: 'Real-Time Insights', desc: 'Instant classification of workplace activity levels.' },
              { icon: Layers, title: 'Zone Intelligence', desc: 'Track movement flow across custom-defined areas.' },
              { icon: ShieldCheck, title: 'Smart Alerts', desc: 'Automated notification for crowding or inactivity spikes.' },
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-all">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-4">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Visual Section Placeholder */}
      <section className="h-[60vh] relative overflow-hidden flex items-center justify-center px-8 border-y border-hive-border">
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 opacity-10 flex items-center justify-center"
         >
           <div className="w-[800px] h-[800px] border border-white/20 rounded-full" />
           <div className="w-[600px] h-[600px] border border-white/20 rounded-full absolute" />
           <div className="w-[400px] h-[400px] border border-white/20 rounded-full absolute" />
         </motion.div>
         <div className="relative text-center max-w-2xl">
           <h2 className="text-3xl font-bold uppercase tracking-widest mb-6">Built for the next frontier of workspace coordination.</h2>
           <p className="text-sm text-white/60 tracking-widest uppercase">Optimizing movement. Enhancing safety. Privately.</p>
         </div>
      </section>

      <footer className="py-24 px-8 border-t border-hive-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Logo className="w-8 h-8 text-white" />
              <span className="text-xl font-bold uppercase tracking-widest">ProductHive</span>
            </div>
            <p className="text-white/40 text-xs max-w-xs tracking-widest uppercase leading-loose">
              Workforce Intelligence platform by Hive Dynamics. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-24">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Company</h4>
              <nav className="flex flex-col gap-2">
                <a href="#" className="text-xs hover:text-white transition-colors">About</a>
                <a href="#" className="text-xs hover:text-white transition-colors">Contact</a>
                <a href="#" className="text-xs hover:text-white transition-colors">Privacy</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Portal</h4>
              <nav className="flex flex-col gap-2">
                <a href="/admin" className="text-xs hover:text-white transition-colors">Login</a>
                <a href="#" className="text-xs hover:text-white transition-colors">Status</a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
