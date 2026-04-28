import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'EMPLOYEE' | null;

export interface Report {
  id: string;
  issuerId: string;
  issuerName: string;
  timestamp: string;
  message: string;
  intensity: 'Low' | 'Mid' | 'High';
  status: 'General' | 'Issue' | 'Log';
  isResolved: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  privacyMode: boolean;
  setPrivacyMode: (mode: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  reports: Report[];
  addReport: (message: string, intensity: 'Low' | 'Mid' | 'High') => void;
  resolveReport: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [reports, setReports] = useState<Report[]>([
    { 
      id: 'REP-001', 
      issuerId: 'EMP-A12', 
      issuerName: 'Rahul Sharma', 
      timestamp: '10m ago', 
      message: 'Completed Zone A tasks ahead of schedule. Moving to Zone B.', 
      intensity: 'Low',
      status: 'General', 
      isResolved: false 
    },
    { 
      id: 'REP-002', 
      issuerId: 'EMP-B07', 
      issuerName: 'Priya Patel', 
      timestamp: '2h ago', 
      message: 'Camera feed in Zone C seems slightly blurry. Please check.', 
      intensity: 'Mid',
      status: 'Issue', 
      isResolved: false 
    }
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem('hive_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedTheme = localStorage.getItem('hive_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('hive_theme', theme);
  }, [theme]);

  const login = (role: UserRole, email: string) => {
    const mockUser: User = {
      id: role === 'ADMIN' ? 'ADM-001' : 'EMP-A12',
      name: role === 'ADMIN' ? 'Administrator' : 'Rahul Sharma',
      email: email,
      role: role
    };
    setUser(mockUser);
    localStorage.setItem('hive_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hive_user');
  };

  const addReport = (message: string, intensity: 'Low' | 'Mid' | 'High') => {
    if (!user) return;
    const newReport: Report = {
      id: `REP-${Math.random().toString(36).substring(7).toUpperCase()}`,
      issuerId: user.id,
      issuerName: user.name,
      timestamp: 'Just now',
      message: message,
      intensity: intensity,
      status: intensity === 'High' ? 'Issue' : 'General',
      isResolved: false
    };
    setReports(prev => [newReport, ...prev]);
  };

  const resolveReport = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, isResolved: true } : r));
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, isAuthenticated: !!user, 
      privacyMode, setPrivacyMode,
      theme, setTheme,
      reports, addReport, resolveReport
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
