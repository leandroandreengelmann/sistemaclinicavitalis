import { Appointment as AppointmentType } from '@/types';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

interface AppointmentStatsProps {
  appointments: AppointmentType[];
  dateRange: 'today' | 'week' | 'month';
}

export default function AppointmentStats({ appointments, dateRange }: AppointmentStatsProps) {
  // Filtra os agendamentos de acordo com o intervalo de tempo selecionado
  const filteredAppointments = appointments.filter((appointment: AppointmentType) => {
    const appointmentDate = parseISO(appointment.start);
    
    if (dateRange === 'today') {
      return isToday(appointmentDate);
    } else if (dateRange === 'week') {
      return isThisWeek(appointmentDate);
    } else if (dateRange === 'month') {
      return isThisMonth(appointmentDate);
    }
    
    return false;
  });

  // Calcula totais
  const totalAppointments = filteredAppointments.length;
  const uniqueDoctors = new Set(filteredAppointments.map(app => app.doctorId)).size;
  const uniquePatients = new Set(filteredAppointments.map(app => app.patientId)).size;
  
  // Calcula a taxa de ocupação (simulada)
  const maxPossibleAppointments = dateRange === 'today' ? 24 : 
                                 dateRange === 'week' ? 80 : 
                                 200; // valores aproximados
  const occupancyRate = Math.round((totalAppointments / maxPossibleAppointments) * 100);

  const stats = [
    {
      title: 'Total de Consultas',
      value: totalAppointments,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: 'bg-indigo-50 dark:bg-gray-800',
    },
    {
      title: 'Médicos Ativos',
      value: uniqueDoctors,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bgColor: 'bg-emerald-50 dark:bg-gray-800',
    },
    {
      title: 'Pacientes Atendidos',
      value: uniquePatients,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bgColor: 'bg-rose-50 dark:bg-gray-800',
    },
    {
      title: 'Taxa de Ocupação',
      value: `${occupancyRate}%`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-amber-50 dark:bg-gray-800',
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} p-6 rounded-lg shadow-sm stat-card hover:shadow-md dark:hover:shadow-gray-700/50 transition-shadow duration-200`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{stat.value}</p>
            </div>
            <div>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </>
  );
} 