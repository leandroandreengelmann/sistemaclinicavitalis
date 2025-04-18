import React from 'react';
import { Appointment, Patient } from '@/types'; // Precisa do tipo Patient
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import patientsData from '@/data/patients.json'; // Precisa dos dados dos pacientes
import AppointmentStatus from '@/components/dashboard/agendamentos/AppointmentStatus';
import Link from 'next/link';

interface DoctorAppointmentHistoryProps {
  appointments: Appointment[];
}

const DoctorAppointmentHistory: React.FC<DoctorAppointmentHistoryProps> = ({ appointments }) => {
  const patients: Patient[] = patientsData;

  // Ordenar agendamentos por data de início (mais recentes primeiro)
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(b.start).getTime() - new Date(a.start).getTime()
  );

  if (sortedAppointments.length === 0) {
    return <p className="text-center text-gray-500 py-4">Nenhum agendamento encontrado para este médico.</p>;
  }

  const formatDate = (dateString: string, dateFormat = "dd/MM/yyyy HH:mm") => {
    try {
      return format(new Date(dateString), dateFormat, { locale: ptBR });
    } catch {
      return "Inválido";
    }
  };

  // Função para buscar nome do paciente
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'N/A';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
              Horário
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
              Paciente
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAppointments.map((appointment) => (
            <tr key={appointment.id}>
              <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                {formatDate(appointment.start, 'dd/MM/yyyy')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                {formatDate(appointment.start, 'HH:mm')} - {formatDate(appointment.end, 'HH:mm')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                {/* Exibir nome do paciente e link para ele */}
                <Link href={`/dashboard/patients/${appointment.patientId}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                  {getPatientName(appointment.patientId)}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <AppointmentStatus start={appointment.start} end={appointment.end} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorAppointmentHistory; 