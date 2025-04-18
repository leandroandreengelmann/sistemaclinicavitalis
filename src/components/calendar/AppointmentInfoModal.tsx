import React from 'react';
import { Appointment, Doctor, Patient } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import AppointmentStatus from '@/components/dashboard/agendamentos/AppointmentStatus';

interface AppointmentInfoModalProps {
  appointment: Appointment;
  position: { x: number; y: number };
  colorClasses: { bg: string; border: string; text: string };
  // onClose?: () => void; // Pode ser adicionado se necessário
}

const AppointmentInfoModal: React.FC<AppointmentInfoModalProps> = ({ 
    appointment, 
    position, 
    colorClasses 
}) => {
  const doctors: Doctor[] = doctorsData;
  const patients: Patient[] = patientsData;

  const doctor = doctors.find(d => d.id === appointment.doctorId);
  const patient = patients.find(p => p.id === appointment.patientId);

  // Adicionando verificação para caso appointment seja null/undefined inesperadamente
  if (!appointment) return null;

  // Tratamento de erro básico para datas inválidas
  let startTime = 'Inválido';
  let endTime = 'Inválido';
  let date = 'Inválido';
  try {
    startTime = format(parseISO(appointment.start), 'HH:mm', { locale: ptBR });
    endTime = format(parseISO(appointment.end), 'HH:mm', { locale: ptBR });
    date = format(parseISO(appointment.start), 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    console.error("Erro ao formatar datas do agendamento:", e);
  }

  // Estilo para posicionar o modal
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x + 15}px`, 
    top: `${position.y + 15}px`,
    zIndex: 1050, // z-index alto para sobrepor outros elementos
    pointerEvents: 'none', // Evita que o modal intercepte cliques do mouse
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM HH:mm", { locale: ptBR });
    } catch {
      return "Inválido";
    }
  };

  return (
    <div 
        style={style} 
        // Aumentar largura (ex: w-80) e padding (ex: p-4)
        className={`absolute p-4 rounded-lg shadow-xl w-80 
                    ${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border} 
                    bg-opacity-95 border-opacity-80 backdrop-blur-sm 
                    animate-fade-in`}
    >
      {/* Aumentar tamanho do título */}
      <h4 className={`font-bold text-lg mb-2 border-b border-current pb-1 opacity-90`}>Detalhes</h4>
      {/* Aumentar tamanho da fonte do conteúdo */}
      <div className="space-y-1 text-base font-medium">
        <p><span className="font-semibold opacity-80">Data:</span> {date}</p>
        <p><span className="font-semibold opacity-80">Horário:</span> {startTime} - {endTime}</p>
        <p><span className="font-semibold opacity-80">Paciente:</span> {patient?.name || 'N/A'}</p>
        <p><span className="font-semibold opacity-80">Médico:</span> {doctor?.name || 'N/A'}</p>
      </div>
      <div className="mt-2 pt-2 border-t border-white border-opacity-50">
        <AppointmentStatus start={appointment.start} end={appointment.end} />
      </div>
    </div>
  );
};

export default AppointmentInfoModal; 