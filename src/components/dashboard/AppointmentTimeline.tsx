import React from 'react';
import { Appointment, Doctor } from '@/types/index';
// Importar funções necessárias de date-fns
import { isToday, isThisWeek, isThisMonth, parseISO, format, isPast } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { useAppointments } from '@/context/AppointmentsContext';
import { useDoctors } from '@/context/DoctorsContext';
import AppointmentStatus from '@/components/dashboard/agendamentos/AppointmentStatus';

interface AppointmentTimelineProps {
  appointments: Appointment[];
  dateRange: 'today' | 'week' | 'month';
}

// Restaurar Função auxiliar para obter valor numérico do status para ordenação
const getAppointmentStatusValue = (appointment: Appointment): number => {
  try {
    const startTime = parseISO(appointment.start).getTime();
    const endTime = parseISO(appointment.end).getTime();
    const now = Date.now();

    if (now < startTime) {
      return 1; // Agendado (Prioridade mais alta)
    } else if (now >= startTime && now <= endTime) {
      return 2; // Em Andamento
    } else { // now > endTime
      return 3; // Finalizado (Prioridade mais baixa)
    }
  } catch (e) {
    console.error("Erro ao calcular status para ordenação:", appointment.start, e);
    return 4; // Colocar erros no final
  }
};

const AppointmentTimeline: React.FC<AppointmentTimelineProps> = ({ appointments: initialAppointments, dateRange }) => {
  // Usar contexto para pegar os appointments atualizados
  const { appointments: contextAppointments, updateAppointment } = useAppointments();
  // Usar contexto para médicos
  const { doctors: allDoctors, getDoctorById } = useDoctors();

  // Usar os appointments do contexto que já incluem o status
  const appointments = initialAppointments.map(initialApp => 
    contextAppointments.find(ctxApp => ctxApp.id === initialApp.id) || initialApp
  );

  // Restaurar lógica de filtro anterior
  const filteredAppointments = appointments.filter(appointment => {
    try {
      const appointmentDate = parseISO(appointment.start);
      if (dateRange === 'today') {
        return isToday(appointmentDate);
      } else if (dateRange === 'week') {
        return isThisWeek(appointmentDate, { locale: ptBR });
      } else if (dateRange === 'month') {
        return isThisMonth(appointmentDate);
      }
    } catch (e) {
      console.error("Erro ao filtrar data:", appointment.start, e);
      return false;
    }
    return false;
  });

  // Restaurar ordenação por Status e depois por Hora
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const statusA = getAppointmentStatusValue(a);
    const statusB = getAppointmentStatusValue(b);

    // Ordenar primeiro pelo status (Em Andamento > Agendado > Finalizado)
    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // Se o status for o mesmo, ordenar pela hora de início (mais cedo primeiro)
    try {
        return parseISO(a.start).getTime() - parseISO(b.start).getTime();
    } catch (e) {
        console.error("Erro ao ordenar datas (dentro do status):", a.start, b.start, e);
        return 0;
    }
  });

  const handleFinalizar = (id: string) => {
    updateAppointment(id, { status: 'Finalizado' });
    // O toast de sucesso/erro já é tratado no context
  };

  return (
    // Container adjusted for dark mode
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Title adjusted for dark mode */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Linha do Tempo de Consultas ({dateRange})</h2>
      
      {sortedAppointments.length === 0 ? (
        // Empty state adjusted for dark mode
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
          <p className="mt-2 text-gray-500 dark:text-gray-400">Nenhuma consulta encontrada para este período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => {
            let startDate, endDate, formattedDate, formattedStartTime, formattedEndTime;
            try {
                startDate = parseISO(appointment.start);
                endDate = parseISO(appointment.end);
                formattedDate = format(startDate, "d 'de' MMMM", { locale: ptBR });
                formattedStartTime = format(startDate, 'HH:mm');
                formattedEndTime = format(endDate, 'HH:mm');
            } catch(e) {
                console.error("Erro ao formatar data específica:", appointment.start, e);
                formattedDate = "Inválido";
                formattedStartTime = "Inválido";
                formattedEndTime = "Inválido";
            }
            
            // Buscar o médico e sua cor usando o contexto
            const doctor = getDoctorById(appointment.doctorId);
            const doctorName = doctor?.name || 'Médico desconhecido';
            const doctorColor = doctor?.color;
            
            // Buscar nome do paciente (exemplo, precisaria dos dados)
            const patientName = "Paciente Exemplo"; // Placeholder

            // Verificar se consulta já terminou
            const consultaTerminou = isPast(endDate || new Date());

            return (
              <div key={appointment.id} className="flex items-start">
                {/* Time block adjusted for dark mode */}
                <div className="flex-shrink-0 w-20 text-center pt-1">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formattedStartTime}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{formattedEndTime}</span>
                </div>
                {/* Details block adjusted for dark mode */}
                <div className="ml-3 bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-700 rounded-md p-3 flex-grow shadow-sm hover:shadow dark:hover:shadow-gray-600/50 transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <div>
                      {/* Patient/Doctor text adjusted for dark mode */}
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{patientName}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-xs">Dr(a). {doctorName}</p>
                    </div>
                    <div className="mt-1 sm:mt-0 text-right">
                       {/* Date text adjusted for dark mode */}
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
                    </div>
                  </div>
                  
                   {/* Separator adjusted for dark mode */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      {/* Status badges - Assuming AppointmentStatus handles its own dark mode */}
                      {appointment.status === 'Finalizado' ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200">
                          ✔️ Finalizado
                        </span>
                      ) : consultaTerminou ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200">
                          Aguardando Finalização
                        </span>
                      ) : (
                        <AppointmentStatus 
                          start={appointment.start} 
                          end={appointment.end} 
                          doctorColor={doctorColor}
                        />
                      )}
                  </div>

                   {/* Finish button adjusted for dark mode */}
                  {consultaTerminou && appointment.status !== 'Finalizado' && (
                    <div className="text-right mt-2">
                      <button
                        onClick={() => handleFinalizar(appointment.id)}
                        className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                      >
                        Finalizar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentTimeline; 