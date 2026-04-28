import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'EMPLOYEE' | null;

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('hive_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, privacyMode, setPrivacyMode }}>
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
