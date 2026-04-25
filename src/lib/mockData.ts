import { MovementLevel } from '../types';

export interface DailyActivity {
  date: string;
  hoursWorked: number;
  talkingTime: number;
  lunchTime: number;
  inactiveTime: number;
  zones: { zone: string; duration: number }[];
  topActivity: string;
}

export function generateEmployeeHistory(employeeId: string): DailyActivity[] {
  const history: DailyActivity[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip weekends (mostly)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend && Math.random() > 0.2) continue;

    const baseHours = isWeekend ? 2 : 8;
    const hoursWorked = +(baseHours + (Math.random() * 2 - 1)).toFixed(1);
    const talkingTime = +(Math.random() * 1.5).toFixed(1);
    const lunchTime = isWeekend ? 0 : +(0.5 + Math.random() * 0.5).toFixed(1);
    const inactiveTime = +(Math.random() * 1).toFixed(1);

    history.push({
      date: date.toISOString().split('T')[0],
      hoursWorked,
      talkingTime,
      lunchTime,
      inactiveTime,
      zones: [
        { zone: 'Zone A', duration: +(hoursWorked * 0.4).toFixed(1) },
        { zone: 'Zone B', duration: +(hoursWorked * 0.3).toFixed(1) },
        { zone: 'Zone C', duration: +(hoursWorked * 0.2).toFixed(1) },
        { zone: 'Zone D', duration: +(hoursWorked * 0.1).toFixed(1) },
      ],
      topActivity: hoursWorked > 6 ? 'Productive' : 'Steady',
    });
  }
  
  return history;
}

export function getSummary(history: DailyActivity[]) {
  const totalHours = history.reduce((acc, curr) => acc + curr.hoursWorked, 0);
  const totalTalking = history.reduce((acc, curr) => acc + curr.talkingTime, 0);
  const totalLunch = history.reduce((acc, curr) => acc + curr.lunchTime, 0);
  const avgHours = totalHours / history.length;
  
  return {
    totalHours: totalHours.toFixed(1),
    avgHours: avgHours.toFixed(1),
    totalTalking: totalTalking.toFixed(1),
    totalLunch: totalLunch.toFixed(1),
    attendanceRate: Math.round((history.length / 30) * 100),
  };
}
