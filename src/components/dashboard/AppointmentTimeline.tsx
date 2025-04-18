import React from 'react';
import { Appointment } from '@/types';
// Importar funções necessárias de date-fns
import { isToday, isThisWeek, isThisMonth, parseISO, format } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import AppointmentStatus from '@/components/dashboard/agendamentos/AppointmentStatus';

interface AppointmentTimelineProps {
  appointments: Appointment[];
  dateRange: 'today' | 'week' | 'month';
}

// Função auxiliar para obter valor numérico do status
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

const AppointmentTimeline: React.FC<AppointmentTimelineProps> = ({ appointments, dateRange }) => {
  
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

  // Modificar a lógica de ordenação
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const statusA = getAppointmentStatusValue(a);
    const statusB = getAppointmentStatusValue(b);

    // Ordenar primeiro pelo status
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

  // Restaurar mapeamento de doctors/patients para acesso rápido
  const doctors = doctorsData.reduce((acc, doctor) => {
    acc[doctor.id] = doctor.name;
    return acc;
  }, {} as { [key: string]: string });

  const patients = patientsData.reduce((acc, patient) => {
    acc[patient.id] = patient.name;
    return acc;
  }, {} as { [key: string]: string });

  return (
    // Usar a classe de container anterior
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Linha do Tempo de Consultas ({dateRange})</h2>
      
      {sortedAppointments.length === 0 ? (
        // Usar a mensagem de "nenhum encontrado" anterior
        <div className="text-center py-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-gray-500">Nenhuma consulta encontrada para este período.</p>
        </div>
      ) : (
        // Usar a estrutura de lista anterior
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
            
            const doctorName = doctors[appointment.doctorId] || 'Médico não encontrado';
            const patientName = patients[appointment.patientId] || 'Paciente não encontrado';

            return (
              // Estrutura do item da lista anterior
              <div key={appointment.id} className="flex items-start">
                {/* Bloco da Hora */}
                <div className="flex-shrink-0 w-20 text-center pt-1">
                  <span className="text-sm font-semibold text-indigo-600">{formattedStartTime}</span>
                  <span className="block text-xs text-gray-500">{formattedEndTime}</span>
                </div>
                {/* Bloco dos Detalhes */}
                <div className="ml-3 bg-gray-50 border rounded-md p-3 flex-grow shadow-sm hover:shadow transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{patientName}</h3>
                      <p className="text-gray-600 text-xs">Dr(a). {doctorName}</p>
                    </div>
                    <div className="mt-1 sm:mt-0 text-right">
                      <p className="text-xs text-gray-500">{formattedDate}</p>
                    </div>
                  </div>
                  {/* Adicionar o Status aqui dentro do bloco de detalhes */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                      <AppointmentStatus start={appointment.start} end={appointment.end} />
                  </div>
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