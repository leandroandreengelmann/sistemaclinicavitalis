import { Appointment } from '@/types';
import { parseISO, format, isFuture, isToday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export default function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  // Filtra os agendamentos futuros (incluindo os de hoje)
  const futureAppointments = appointments.filter(appointment => {
    const now = new Date();
    const appointmentDate = parseISO(appointment.start);
    return isFuture(appointmentDate) || (isToday(appointmentDate) && differenceInMinutes(appointmentDate, now) > 0);
  });

  // Ordena os agendamentos por data (mais próximos primeiro)
  const sortedAppointments = [...futureAppointments].sort((a, b) => {
    return parseISO(a.start).getTime() - parseISO(b.start).getTime();
  });

  // Pega os próximos 5 agendamentos
  const upcomingAppointments = sortedAppointments.slice(0, 5);

  // Mapeia os doutores e pacientes para acesso rápido
  const doctors = doctorsData.reduce((acc, doctor) => {
    acc[doctor.id] = doctor.name;
    return acc;
  }, {} as { [key: string]: string });

  const patients = patientsData.reduce((acc, patient) => {
    acc[patient.id] = patient.name;
    return acc;
  }, {} as { [key: string]: string });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Próximas Consultas</h2>
      
      {upcomingAppointments.length === 0 ? (
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
          <p className="mt-2 text-gray-500">Nenhuma consulta agendada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => {
            const startDate = parseISO(appointment.start);
            const formattedDate = format(startDate, "d MMM", { locale: ptBR });
            const formattedTime = format(startDate, 'HH:mm');
            const patientName = patients[appointment.patientId] || 'Paciente não encontrado';
            const doctorName = doctors[appointment.doctorId] || 'Médico não encontrado';

            return (
              <div 
                key={appointment.id} 
                className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4 flex-grow">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-800">{patientName}</p>
                    <span className="text-sm text-gray-500">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-gray-600">Dr. {doctorName}</p>
                    <span className="text-sm font-medium text-indigo-600">{formattedTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 