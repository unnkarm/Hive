import { useEffect, useState } from 'react';
import { Camera, Session, Alert, DashboardStats, MovementLevel } from './types';

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
const ACTIVITIES: MovementLevel[] = ['High', 'Medium', 'Low', 'Idle', 'Break'];

export function useAppSimulator() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeZones: 0,
    movementPercentage: 0,
    idlePercentage: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    // Initial data
    const initialCameras: Camera[] = [
      { id: '1', name: 'CAM-01', zone: 'Zone A', status: 'Online', latency: 42, health: 98, activity: 'Medium', confidence: 92 },
      { id: '2', name: 'CAM-02', zone: 'Zone B', status: 'Online', latency: 120, health: 85, activity: 'High', confidence: 88 },
      { id: '3', name: 'CAM-03', zone: 'Zone C', status: 'Online', latency: 65, health: 94, activity: 'Idle', confidence: 95 },
      { id: '4', name: 'CAM-04', zone: 'Zone D', status: 'Offline', latency: 0, health: 0, activity: 'Idle', confidence: 0 },
    ];
    setCameras(initialCameras);

    const initialSessions: Session[] = [
      { id: 'S-A12', startTime: '10:15 AM', duration: '45m', zonesVisited: ['Zone A', 'Zone C', 'Zone B'], activityDistribution: [{ label: 'High', percentage: 40 }, { label: 'Medium', percentage: 50 }, { label: 'Low', percentage: 10 }] },
      { id: 'S-B07', startTime: '10:30 AM', duration: '30m', zonesVisited: ['Zone B', 'Zone D'], activityDistribution: [{ label: 'Medium', percentage: 70 }, { label: 'Idle', percentage: 30 }] },
    ];
    setSessions(initialSessions);

    const initialAlerts: Alert[] = [
      { id: '1', timestamp: '11:02 AM', zone: 'Zone D', type: 'Unusual Crowd', severity: 'Medium', status: 'Active' },
      { id: '2', timestamp: '10:45 AM', zone: 'Zone B', type: 'Restricted Entry', severity: 'High', status: 'Resolved' },
    ];
    setAlerts(initialAlerts);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCameras(prev => prev.map(c => {
        if (c.status === 'Offline') return c;
        const newActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        return {
          ...c,
          activity: newActivity,
          latency: Math.max(20, c.latency + (Math.random() * 10 - 5)),
          confidence: Math.min(100, Math.max(80, c.confidence + (Math.random() * 2 - 1)))
        };
      }));

      // Randomly add a session
      if (Math.random() > 0.95) {
        setSessions(prev => [
          {
            id: `S-${Math.random().toString(36).substring(7).toUpperCase()}`,
            startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: '1m',
            zonesVisited: [ZONES[Math.floor(Math.random() * ZONES.length)]],
            activityDistribution: [{ label: 'Medium', percentage: 100 }]
          },
          ...prev.slice(0, 9)
        ]);
      }

      // Update Stats
      const online = cameras.filter(c => c.status === 'Online');
      const activeZs = new Set(online.map(c => c.zone)).size;
      const highMedCount = online.filter(c => c.activity === 'High' || c.activity === 'Medium').length;
      const movePerc = online.length ? Math.round((highMedCount / online.length) * 100) : 0;
      const idleCount = online.filter(c => c.activity === 'Idle' || c.activity === 'Break').length;
      const idlePerc = online.length ? Math.round((idleCount / online.length) * 100) : 0;

      setStats({
        activeZones: activeZs,
        movementPercentage: movePerc,
        idlePercentage: idlePerc,
        activeAlerts: alerts.filter(a => a.status === 'Active').length,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [cameras, alerts]);

  return { cameras, sessions, alerts, stats, setAlerts };
}
