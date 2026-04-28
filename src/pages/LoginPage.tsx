import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../lib/AuthContext';
import { Logo } from '../components/Logo';
import { Shield, User, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import Grainient from '../components/Grainient';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fixed Admin Password Check
    if (selectedRole === 'ADMIN' && password !== 'admin123') {
      setError('Invalid Administrator Access Key');
      return;
    }

    setError('');
    login(selectedRole, email || (selectedRole === 'ADMIN' ? 'admin@producthive.ai' : 'rahul.s@producthive.ai'));
    navigate(location.state?.from?.pathname || (selectedRole === 'ADMIN' ? '/admin' : '/employee'), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#120f17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 z-0">
        <Grainient
          color1="#4a4a4a"
          color2="#1a1a1a"
          color3="#2d2d2d"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-black/60 backdrop-blur-[32px] rounded-xl border border-white/10 p-8 md:p-12 space-y-8 shadow-2xl shadow-black/80">
          <div className="flex flex-col items-center gap-4 text-center">
            <Logo className="w-12 h-12 text-white" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Secure Access</h1>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">ProductHive Intelligence Portal</p>
            </div>
          </div>

          <div className="flex p-1 bg-white/5 rounded">
            <button 
              onClick={() => setSelectedRole('ADMIN')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                selectedRole === 'ADMIN' ? "bg-white text-black" : "text-white/40 hover:text-white"
              )}
            >
              <Shield className="w-3 h-3" /> Admin
            </button>
            <button 
              onClick={() => setSelectedRole('EMPLOYEE')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                selectedRole === 'EMPLOYEE' ? "bg-white text-black" : "text-white/40 hover:text-white"
              )}
            >
              <User className="w-3 h-3" /> Employee
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 p-4 text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Portal Email</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRole === 'ADMIN' ? 'admin@producthive.ai' : 'employee@producthive.ai'}
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 pr-12 text-sm focus:outline-none focus:border-white/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
            >
              Initialize Session <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-[9px] text-center text-white/30 uppercase tracking-widest">
            Authorized Personnel Only. AI Session Monitoring Active.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
