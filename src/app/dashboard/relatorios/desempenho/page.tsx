'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import { useAppointments } from '@/context/AppointmentsContext';
import { useDoctors } from '@/context/DoctorsContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfMonth, endOfMonth, parseISO, isValid, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar Chart.js para Bar
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Status de Agendamento possíveis (String)
const appointmentStatusOptions: string[] = ['Agendado', 'Confirmado', 'Realizado', 'Cancelado', 'NoShow', 'Finalizado']; // Adicionei 'Finalizado' que vi no context
const ALL_STATUS = 'all';

export default function DesempenhoMedicoPage() {
  const { appointments } = useAppointments();
  const { doctors, getDoctorById } = useDoctors();

  // --- Estados dos Filtros ---
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(subMonths(new Date(), 3)));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUS); // << Tipo string

  // --- Lógica de Filtragem e Processamento ---

  const appointmentsPerDoctor = useMemo(() => {
    const start = startDate ? startOfDay(startDate) : null;
    const end = endDate ? endOfDay(endDate) : null;

    const filteredAppointments = appointments.filter(apt => {
      const appointmentDate = parseISO(apt.end); // << CORRIGIDO: date -> end
      if (!isValid(appointmentDate)) return false;

      // Filtro de Data
      if (start && appointmentDate < start) return false;
      if (end && appointmentDate > end) return false;

      // Filtro de Status (comparando strings)
      if (selectedStatus !== ALL_STATUS && apt.status !== selectedStatus) return false;

      return true;
    });

    // Contar agendamentos por médico
    const counts: { [doctorId: string]: number } = {};
    filteredAppointments.forEach(apt => {
      if (apt.doctorId) {
        counts[apt.doctorId] = (counts[apt.doctorId] || 0) + 1;
      }
    });

    // Preparar dados para o gráfico
    const doctorLabels = Object.keys(counts).map(id => getDoctorById(id)?.name ?? `ID: ${id}`);
    const appointmentCounts = Object.values(counts);

    return {
      labels: doctorLabels,
      datasets: [
        {
          label: `Nº de Atendimentos (${selectedStatus === ALL_STATUS ? 'Todos Status' : selectedStatus})`,
          data: appointmentCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };

  }, [appointments, doctors, startDate, endDate, selectedStatus, getDoctorById]);

  // --- Opções do Gráfico ---
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Número de Atendimentos por Médico' },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } // Garante que o eixo Y conte de 1 em 1
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">Relatórios de Desempenho Médico</h1>

        {/* --- Área de Filtros --- */}
        <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Filtro de Data */}
          <div className="md:col-span-2 flex items-center space-x-2">
            <div className='flex-1'>
                <label htmlFor="startDatePerf" className="block text-sm font-medium text-gray-700 mb-1">De</label>
                <DatePicker
                  id="startDatePerf"
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholderText="Data Início"
                />
            </div>
             <div className='flex-1'>
                <label htmlFor="endDatePerf" className="block text-sm font-medium text-gray-700 mb-1">Até</label>
                <DatePicker
                  id="endDatePerf"
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate ?? undefined}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholderText="Data Fim"
                />
            </div>
          </div>

          {/* Filtro Status Agendamento */}
          <div>
            <label htmlFor="statusFilterPerf" className="block text-sm font-medium text-gray-700 mb-1">Status Agendamento</label>
            <select
              id="statusFilterPerf"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)} // << onChange está correto para string
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value={ALL_STATUS}>Todos</option>
              {appointmentStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Área de Gráficos e Tabelas --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico Atendimentos por Médico */}
          <div className="bg-white p-4 rounded shadow h-96">
             {appointmentsPerDoctor.labels.length > 0 ? (
                <Bar options={barChartOptions} data={appointmentsPerDoctor} />
             ) : (
                <p className="text-center text-gray-500 flex items-center justify-center h-full">Nenhum atendimento encontrado para os filtros selecionados.</p>
             )}
          </div>

          {/* Gráfico Faturamento por Médico (Placeholder) */}
          <div className="bg-white p-4 rounded shadow h-96 flex items-center justify-center">
             <p className="text-center text-gray-500">Gráfico de Faturamento por Médico (Em breve)</p>
          </div>

          {/* Tabela Ranking (Placeholder) */}
          <div className="bg-white p-4 rounded shadow lg:col-span-2 flex items-center justify-center min-h-[10rem]">
            <p className="text-center text-gray-500">Tabela de Ranking (Em breve)</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 