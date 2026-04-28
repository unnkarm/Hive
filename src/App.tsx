/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCameras } from './pages/AdminCameras';
import { AdminSessions } from './pages/AdminSessions';
import { AdminAlerts } from './pages/AdminAlerts';
import { AdminSettings } from './pages/AdminSettings';
import { SubjectRegistration } from './pages/SubjectRegistration';
import { LiveTrackingPortal } from './pages/LiveTrackingPortal';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { Navbar, AdminSideNav } from './components/Navigation';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-hive-black overflow-x-hidden">
      <AdminSideNav />
      <main className="flex-1 overflow-y-auto technical-grid">
        <Outlet />
      </main>
    </div>
  );
}

function SiteLayout() {
  return (
    <div className="min-h-screen bg-hive-black">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function EmployeeLayout() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-hive-black flex flex-col">
      <nav className="border-b border-hive-border px-8 py-4 flex justify-between items-center bg-hive-dark/80 backdrop-blur-md sticky top-0 z-50">
         <div className="text-xl font-black uppercase tracking-tighter text-hive-text">ProductHive <span className="text-hive-text-20">Workplace</span></div>
         <button 
           onClick={logout}
           className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border border-hive-border text-hive-text hover:bg-hive-accent hover:text-hive-black transition-all rounded shadow-sm"
         >
           Close Session
         </button>
      </nav>
      <main className="flex-1 technical-grid">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="live" element={<LiveTrackingPortal />} />
            <Route path="cameras" element={<AdminCameras />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="registration" element={<SubjectRegistration />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="alerts" element={<AdminAlerts />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="/employee" element={
            <ProtectedRoute allowedRole="EMPLOYEE">
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}


