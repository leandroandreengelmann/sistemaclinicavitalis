'use client';

import { useState } from 'react';
import { useAppointments } from '@/context/AppointmentsContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AppointmentStats from '@/components/dashboard/AppointmentStats';
import AppointmentTimeline from '@/components/dashboard/AppointmentTimeline';
import DoctorPerformance from '@/components/dashboard/DoctorPerformance';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';

export default function DashboardPage() {
  const { appointments } = useAppointments();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  return (
    <DashboardLayout>
      <DashboardHeader 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange} 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AppointmentStats 
          appointments={appointments} 
          dateRange={dateRange} 
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppointmentTimeline 
            appointments={appointments} 
            dateRange={dateRange} 
          />
        </div>
        <div className="space-y-6">
          <UpcomingAppointments 
            appointments={appointments} 
          />
          <DoctorPerformance 
            appointments={appointments} 
            dateRange={dateRange} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 