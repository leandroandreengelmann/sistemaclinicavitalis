import React from 'react';
import { Appointment, Doctor } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import doctorsData from '@/data/doctors.json';
import AppointmentStatus from '@/components/dashboard/agendamentos/AppointmentStatus';
import Link from 'next/link'; // Para linkar para o agendamento se necessário no futuro

interface PatientAppointmentHistoryProps {
  appointments: Appointment[];
}

const PatientAppointmentHistory: React.FC<PatientAppointmentHistoryProps> = ({ appointments }) => {
  const doctors: Doctor[] = doctorsData;

  // Ordenar agendamentos por data de início (mais recentes primeiro)
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(b.start).getTime() - new Date(a.start).getTime()
  );

  if (sortedAppointments.length === 0) {
    return <p className="text-center text-gray-500 py-4">Nenhum agendamento encontrado para este paciente.</p>;
  }

  const formatDate = (dateString: string, dateFormat = "dd/MM/yyyy HH:mm") => {
    try {
      return format(new Date(dateString), dateFormat, { locale: ptBR });
    } catch {
      return "Inválido";
    }
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'N/A';

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
              Médico
            </th>
            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            {/* <th scope="col" className="relative px-4 py-2">
              <span className="sr-only">Detalhes</span>
            </th> */}
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
                Dr(a). {getDoctorName(appointment.doctorId)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <AppointmentStatus start={appointment.start} end={appointment.end} />
              </td>
              {/* <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                <Link href={`/dashboard/agendamentos/${appointment.id}`} // Exemplo de link futuro
                      className="text-indigo-600 hover:text-indigo-800 text-xs">
                   Ver
                </Link>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientAppointmentHistory; 