import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardHeaderProps {
  dateRange: 'today' | 'week' | 'month';
  onDateRangeChange: (range: 'today' | 'week' | 'month') => void;
}

export default function DashboardHeader({ dateRange, onDateRangeChange }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualiza o horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(currentTime, 'HH:mm');

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1 capitalize">{formattedDate}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg shadow-sm text-gray-700 font-medium">
            <span className="mr-2">⏰</span>
            {formattedTime}
          </div>
          <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600 font-semibold">
            Bem-vindo, Dr. Silva
          </div>
        </div>
      </div>
      
      <div className="bg-white p-3 rounded-lg shadow-sm flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            dateRange === 'today'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onDateRangeChange('today')}
        >
          Hoje
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            dateRange === 'week'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onDateRangeChange('week')}
        >
          Esta Semana
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            dateRange === 'month'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onDateRangeChange('month')}
        >
          Este Mês
        </button>
      </div>
    </div>
  );
} 