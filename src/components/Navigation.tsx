import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, Camera, Users, BarChart3, Bell, Settings, UserPlus, ArrowLeft, LogOut, Shield, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { useAuth } from '../lib/AuthContext';

export function Navbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isEmployee = location.pathname.startsWith('/employee');
  const isLogin = location.pathname === '/login';
  const { isAuthenticated, user, logout } = useAuth();

  if (isAdmin || isEmployee || isLogin) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-12 py-8 bg-black/50 backdrop-blur-xl border-b border-white/5">
      <Link to="/" className="flex items-center gap-2 group">
        <Logo className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" />
        <span className="text-2xl font-black tracking-tighter uppercase">ProductHive</span>
      </Link>

      <div className="flex items-center gap-6">
        {!isAuthenticated ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/login"
              className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-hive-success transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,0,0.5)] rounded-sm block"
            >
              Join Portal
            </Link>
          </motion.div>
        ) : (
          <Link
            to={user?.role === 'ADMIN' ? '/admin' : '/employee'}
            className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-hive-success transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.3)] rounded-sm"
          >
            Dashboard
          </Link>
        )}
      </div>
    </nav>

  );
}

export function AdminSideNav() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Enrollment', path: '/admin/registration', icon: UserPlus },
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Cameras', path: '/admin/cameras', icon: Camera },
    { name: 'Sessions', path: '/admin/sessions', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Alerts', path: '/admin/alerts', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];


  return (
    <div className="w-64 h-screen border-r border-hive-border flex flex-col bg-hive-dark sticky top-0">
      <div className="p-8 pb-10 flex items-center gap-3">
        <Logo className="w-8 h-8 text-white" />
        <span className="text-lg font-bold tracking-tighter uppercase">ProductHive <span className="text-[10px] opacity-40 ml-1">v1.2</span></span>
      </div>

      <div className="px-8 pb-8">
         <div className="bg-white/5 border border-white/5 p-4 rounded flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
               <Shield className="w-4 h-4 text-white/60" />
            </div>
            <div className="overflow-hidden">
               <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">{user?.name || 'Admin'}</div>
               <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">Active Shell</div>
            </div>
         </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded text-xs font-medium uppercase tracking-widest transition-all",
                isActive 
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
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
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3 h-3" /> Terminate Session
        </button>
        <Link 
          to="/" 
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Website
        </Link>
        <div className="flex items-center gap-2 opacity-30 text-[10px] uppercase tracking-widest pt-2">
          System Optimal
        </div>
      </div>
    </div>
  );
}

