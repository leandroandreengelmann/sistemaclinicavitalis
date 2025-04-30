import { Appointment } from '@/types';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import doctorsData from '@/data/doctors.json';

interface DoctorPerformanceProps {
  appointments: Appointment[];
  dateRange: 'today' | 'week' | 'month';
}

export default function DoctorPerformance({ 
  appointments, 
  dateRange 
}: DoctorPerformanceProps) {
  // Filtra os agendamentos de acordo com o intervalo de tempo selecionado
  const filteredAppointments = appointments.filter(appointment => {
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

  // Contagem de consultas por médico
  const doctorCounts = filteredAppointments.reduce((acc, appointment) => {
    const doctorId = appointment.doctorId;
    acc[doctorId] = (acc[doctorId] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Ordena os médicos pelo número de consultas
  const sortedDoctors = Object.entries(doctorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);  // Top 5 médicos

  // Obtém o número máximo de consultas para calcular a porcentagem da barra
  const maxAppointments = sortedDoctors.length > 0 ? sortedDoctors[0][1] : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Desempenho dos Médicos</h2>
      
      {sortedDoctors.length === 0 ? (
        <div className="text-center py-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Nenhum dado disponível para este período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDoctors.map(([doctorId, count]) => {
            const doctor = doctorsData.find(d => d.id === doctorId);
            const doctorName = doctor ? doctor.name : 'Médico não encontrado';
            const percentage = maxAppointments > 0 ? Math.round((count / maxAppointments) * 100) : 0; // Prevent division by zero
            
            return (
              <div key={doctorId}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dr. {doctorName}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{count} consultas</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 