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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">{formattedDate}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 font-medium">
            <span className="mr-2">⏰</span>
            {formattedTime}
          </div>
          <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 font-semibold">
            Bem-vindo, Dr. Silva
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-md transition-colors text-sm ${
            dateRange === 'today'
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          onClick={() => onDateRangeChange('today')}
        >
          Hoje
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors text-sm ${
            dateRange === 'week'
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          onClick={() => onDateRangeChange('week')}
        >
          Esta Semana
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors text-sm ${
            dateRange === 'month'
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          onClick={() => onDateRangeChange('month')}
        >
          Este Mês
        </button>
      </div>
    </div>
  );
} 