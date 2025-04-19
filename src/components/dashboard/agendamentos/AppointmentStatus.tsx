import React, { useState, useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';

interface AppointmentStatusProps {
  start: string; // ISO 8601 string
  end: string;   // ISO 8601 string
  doctorColor?: string; // Nova prop opcional para a cor
}

const AppointmentStatus: React.FC<AppointmentStatusProps> = ({ start, end, doctorColor }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Atualizar a hora atual a cada 10 segundos
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // 10000 ms = 10 segundos

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, []);

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const now = currentTime.getTime();

  let statusText: string;
  let progress: number | null = null;
  let statusColorClass = 'text-gray-500'; // Default color

  if (now < startTime) {
    statusText = 'Agendado';
    statusColorClass = 'text-gray-500';
  } else if (now >= startTime && now <= endTime) {
    statusText = 'Em Andamento';
    statusColorClass = 'text-blue-600';
    const totalDuration = endTime - startTime;
    const elapsedDuration = now - startTime;
    // Evitar divisão por zero se start e end forem iguais
    progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100)) : 0;
  } else { // now > endTime
    statusText = 'Finalizado';
    statusColorClass = 'text-green-600';
  }

  return (
    <div className="flex flex-col">
      <span className={`text-sm font-medium ${statusColorClass}`}>{statusText}</span>
      {progress !== null && (
        <div className="mt-1 w-full animate-fade-in">
          <ProgressBar progress={progress} color={doctorColor} />
        </div>
      )}
    </div>
  );
};

export default AppointmentStatus; 