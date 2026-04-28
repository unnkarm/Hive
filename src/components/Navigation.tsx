import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Camera, Users, BarChart3, Bell, Settings, 
  UserPlus, ArrowLeft, LogOut, Shield, Activity, Sun, Moon 
} from 'lucide-react';
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
    <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-12 py-8 bg-hive-black/50 backdrop-blur-xl border-b border-hive-border transition-all">
      <Link to="/" className="flex items-center gap-2 group">
        <Logo className="w-10 h-10 text-hive-accent group-hover:scale-110 transition-transform duration-500" />
        <span className="text-2xl font-black tracking-tighter uppercase text-hive-text">ProductHive</span>
      </Link>

      <div className="flex items-center gap-6">
        {!isAuthenticated ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/login"
              className="px-8 py-3 bg-hive-accent text-hive-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-hive-success transition-all duration-500 shadow-xl rounded-sm block"
            >
              Join Portal
            </Link>
          </motion.div>
        ) : (
          <Link
            to={user?.role === 'ADMIN' ? '/admin' : '/employee'}
            className="px-8 py-3 bg-hive-accent text-hive-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-hive-success transition-all duration-500 shadow-xl rounded-sm"
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
  const { user, logout, privacyMode, setPrivacyMode, theme, setTheme } = useAuth();

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
    <div className="w-64 h-screen border-r border-hive-border flex flex-col bg-hive-dark sticky top-0 transition-all duration-500">
      <div className="p-8 pb-10 flex items-center gap-3">
        <Logo className="w-8 h-8 text-hive-accent" />
        <span className="text-lg font-bold tracking-tighter uppercase text-hive-text">ProductHive <span className="text-[10px] text-hive-text-40 ml-1">v1.2</span></span>
      </div>

      <div className="px-8 pb-8 space-y-3">
         <div className="glass p-4 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-hive-text-10 rounded flex items-center justify-center">
               <Shield className="w-4 h-4 text-hive-text-60" />
            </div>
            <div className="overflow-hidden">
               <div className="text-[9px] font-bold text-hive-text-40 uppercase tracking-widest truncate">
                 {privacyMode ? '********' : (user?.name || 'Admin')}
               </div>
               <div className="text-[8px] text-hive-success font-bold uppercase tracking-widest">Active Shell</div>
            </div>
         </div>

         {/* Mode Toggles */}
         <div className="grid grid-cols-1 gap-2">
           <div className="flex items-center justify-between px-3 py-2.5 glass rounded-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-hive-text-40">Privacy Mode</span>
              <button 
                onClick={() => setPrivacyMode(!privacyMode)}
                className={cn(
                  "w-8 h-4 rounded-full relative transition-colors",
                  privacyMode ? "bg-hive-success" : "bg-hive-text-10"
                )}
              >
                 <motion.div 
                   animate={{ x: privacyMode ? 18 : 2 }}
                   className="absolute top-1 w-2 h-2 bg-hive-dark rounded-full shadow-sm" 
                 />
              </button>
           </div>

           <div className="flex items-center justify-between px-3 py-2 glass rounded-sm">
              <span className="text-[9px] font-black uppercase tracking-widest text-hive-text-40">Appearance</span>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1 hover:bg-hive-text-10 rounded transition-all group"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-hive-brand group-hover:scale-110 transition-transform" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                )}
              </button>
           </div>
         </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded text-xs font-black uppercase tracking-widest transition-all",
                isActive 
                  ? "bg-hive-accent text-hive-black shadow-lg" 
                  : "text-hive-text-60 hover:bg-hive-text-10 hover:text-hive-text"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-hive-black" : "text-hive-text-40 group-hover:text-hive-text")} />
              {item.name}
            </Link>
          );
        })}

      </nav>

      <div className="p-8 border-t border-hive-border space-y-4">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-hive-error hover:scale-105 transition-transform"
        >
          <LogOut className="w-3 h-3" /> Terminate Session
        </button>
        <Link 
          to="/" 
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hive-text-40 hover:text-hive-text transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Website
        </Link>
        <div className="flex items-center gap-2 opacity-30 text-[10px] uppercase tracking-widest pt-2 text-hive-text">
          System Optimal
        </div>
      </div>
    </div>
  );
}
