export type MovementLevel = 'High' | 'Medium' | 'Low' | 'Idle' | 'Break';

export interface Camera {
  id: string;
  name: string;
  zone: string;
  status: 'Online' | 'Offline';
  latency: number;
  health: number;
  activity: MovementLevel;
  confidence: number;
}

export interface Session {
  id: string;
  startTime: string;
  duration: string;
  zonesVisited: string[]; // e.g. ['Zone A', 'Zone C', 'Zone B']
  activityDistribution: {
    label: MovementLevel;
    percentage: number;
  }[];
}

export interface Alert {
  id: string;
  timestamp: string;
  zone: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Resolved';
}

export interface DashboardStats {
  activeZones: number;
  movementPercentage: number;
  idlePercentage: number;
  activeAlerts: number;
}
