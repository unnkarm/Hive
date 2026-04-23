import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, Camera, Users, BarChart3, Bell, Settings, UserPlus, ArrowLeft, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

export function Navbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-6 bg-transparent">
      <Link to="/" className="flex items-center gap-2 group">
        <Logo className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
        <span className="text-xl font-bold tracking-[0.2em] uppercase">ProductHive</span>
      </Link>

      <div className="hidden md:flex items-center gap-10">
        {/* Links removed as per user request */}
      </div>

      <Link
        to="/admin"
        className="px-6 py-2 border border-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
      >
        Admin Portal
      </Link>
    </nav>
  );
}

export function AdminSideNav() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Cameras', path: '/admin/cameras', icon: Camera },
    { name: 'Sessions', path: '/admin/sessions', icon: Users },
    { name: 'Enrollment', path: '/admin/registration', icon: UserPlus },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Alerts', path: '/admin/alerts', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen border-r border-hive-border flex flex-col bg-hive-dark sticky top-0">
      <div className="p-8 pb-12 flex items-center gap-3">
        <Logo className="w-8 h-8 text-white" />
        <span className="text-lg font-bold tracking-tighter uppercase">ProductHive <span className="text-[10px] opacity-40 ml-1">v1.2</span></span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-none text-xs font-medium uppercase tracking-widest transition-all",
                isActive 
                  ? "bg-white text-black" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-black" : "text-white/40 group-hover:text-white")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t border-hive-border space-y-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Website
        </Link>
        <div className="flex items-center gap-2 opacity-50 text-[10px] uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-hive-success animate-pulse" />
          System Optimal
        </div>
      </div>
    </div>
  );
}
