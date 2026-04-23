/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="live" element={<LiveTrackingPortal />} />
          <Route path="cameras" element={<AdminCameras />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="registration" element={<SubjectRegistration />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

