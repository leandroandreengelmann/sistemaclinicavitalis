import React from 'react';
import { Appointment } from '@/types/index'; // Corrigir caminho se necessário
import { format } from 'date-fns'; // Para formatar datas
import { ptBR } from 'date-fns/locale'; // Para formato brasileiro
import AppointmentStatus from './AppointmentStatus'; // Importar o novo componente
import { useDoctors } from '@/context/DoctorsContext'; // Importar contexto dos médicos

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, onEdit, onDelete }) => {
  
  // Obter a função para buscar médico por ID
  const { getDoctorById } = useDoctors();
  
  // Ordenar agendamentos por data de início (mais recentes primeiro)
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(b.start).getTime() - new Date(a.start).getTime()
  );

  if (!sortedAppointments || sortedAppointments.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Nenhum agendamento encontrado.</p>;
  }

  const formatDate = (dateString: string): string => {
    // Verificação básica se a string é válida e não contém "null"
    if (!dateString || typeof dateString !== 'string' || dateString.includes('null')) {
      console.warn("Tentativa de formatar data inválida (nula ou malformada):", dateString);
      return "Data Inválida";
    }
    try {
      // Tentar criar o objeto Date
      const dateObject = new Date(dateString);
      // Verificar se o objeto Date resultante é válido
      if (isNaN(dateObject.getTime())) {
        console.warn("Falha ao criar objeto Date válido a partir de:", dateString);
        return "Data Inválida";
      }
      // Se a data for válida, formatar
      return format(dateObject, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      // Capturar outros erros inesperados do new Date() ou format()
      console.error("Erro inesperado ao formatar data:", dateString, error);
      return "Erro Format."; // Mensagem curta para erro inesperado
    }
  };

  const now = Date.now(); // Obter o tempo atual uma vez fora do map para otimização

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Título (Paciente / Médico)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Início
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Fim
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedAppointments.map((appointment) => {
            // Buscar médico e cor
            const doctor = getDoctorById(appointment.doctorId);
            const doctorColor = doctor?.color;

            const startTime = new Date(appointment.start).getTime();
            // Desabilitar se o horário de início já passou ou é agora
            const isDisabled = now >= startTime; 

            return (
              <tr key={appointment.id} className="dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {appointment.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatDate(appointment.start)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatDate(appointment.end)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <AppointmentStatus 
                    start={appointment.start} 
                    end={appointment.end} 
                    doctorColor={doctorColor}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                    onClick={() => onEdit(appointment)}
                    disabled={isDisabled} 
                    className={`font-medium ${isDisabled 
                      ? 'text-indigo-400 dark:text-indigo-600 cursor-not-allowed' 
                      : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300'}`}
                    title={isDisabled ? "Não é possível editar agendamentos em andamento ou finalizados" : "Editar agendamento"}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => onDelete(appointment.id)}
                    disabled={isDisabled}
                    className={`font-medium ${isDisabled 
                      ? 'text-red-400 dark:text-red-600 cursor-not-allowed' 
                      : 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300'}`}
                    title={isDisabled ? "Não é possível excluir agendamentos em andamento ou finalizados" : "Excluir agendamento"}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentList; 