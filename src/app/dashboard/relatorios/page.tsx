'use client'; // Necessário para usar hooks e interatividade

import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useFinancials } from '@/context/FinancialContext';
import { useDoctors } from '@/context/DoctorsContext';
import { useHealthPlans } from '@/context/HealthPlansContext';
import { TransactionStatus, FinancialTransaction, FinancialCategory } from '@/types/index';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfMonth, endOfMonth, parseISO, isValid, eachMonthOfInterval, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';

// Registrar Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

// --- Constantes e Tipos ---
const ALL_FILTER = 'all'; // Valor para representar "Todos"

// Opções de Tipo de Transação
const transactionTypeOptions = [
  { value: 'all', label: 'Todas (Saldo)' },
  { value: 'Receita', label: 'Receitas' },
  { value: 'Despesa', label: 'Despesas' },
];

// Status possíveis (pegando do tipo TransactionStatus)
const statusOptions: TransactionStatus[] = ['Pago', 'Recebido', 'Pendente', 'Atrasado', 'Cancelado'];

// --- Componente da Página ---
export default function RelatoriosFinanceirosPage() {
  const { transactions, categories, getCategoryById } = useFinancials();
  const { doctors, getDoctorById } = useDoctors();
  // const { healthPlans, getHealthPlanById } = useHealthPlans(); // << Remover por enquanto

  // --- Estados dos Filtros ---
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
  const [selectedType, setSelectedType] = useState<string>(ALL_FILTER);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_FILTER);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(ALL_FILTER);
  // const [selectedHealthPlan, setSelectedHealthPlan] = useState<string>(ALL_FILTER); // << Remover por enquanto

  // --- Lógica de Filtragem e Processamento de Dados ---
  const filteredTransactions = useMemo(() => {
    const start = startDate ? startOfDay(startDate) : null;
    const end = endDate ? endOfDay(endDate) : null;

    return transactions.filter(tx => {
      const transactionDate = parseISO(tx.paymentDate ?? tx.dueDate); // Usar data de pagamento se houver, senão vencimento
      if (!isValid(transactionDate)) return false; // Ignorar transações sem data válida

      // Filtro de Data
      if (start && transactionDate < start) return false;
      if (end && transactionDate > end) return false;

      // Filtro de Tipo
      if (selectedType !== ALL_FILTER && tx.type !== selectedType) return false;

      // Filtro de Status
      if (selectedStatus.length > 0 && !selectedStatus.includes(tx.status)) return false;

      // Filtro de Categoria
      if (selectedCategory !== ALL_FILTER && tx.categoryId !== selectedCategory) return false;

      // Filtro de Médico
      if (selectedDoctor !== ALL_FILTER && tx.doctorId !== selectedDoctor) return false;

      return true;
    });
  }, [transactions, startDate, endDate, selectedType, selectedStatus, selectedCategory, selectedDoctor]);

  // Dados para Gráfico de Linha (Agrupado por Mês)
  const monthlyChartData = useMemo(() => {
    if (!startDate || !endDate) return { labels: [], datasets: [] };

    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const labels = months.map(m => format(m, 'MMM/yy', { locale: ptBR }));

    const dataReceitas: number[] = Array(months.length).fill(0);
    const dataDespesas: number[] = Array(months.length).fill(0);

    filteredTransactions.forEach(tx => {
      const transactionDate = parseISO(tx.paymentDate ?? tx.dueDate);
      if (!isValid(transactionDate)) return;

      const monthIndex = months.findIndex(m => format(m, 'yyyy-MM') === format(transactionDate, 'yyyy-MM'));
      if (monthIndex !== -1) {
        if (tx.type === 'Receita') {
          dataReceitas[monthIndex] += tx.value;
        } else if (tx.type === 'Despesa') {
          dataDespesas[monthIndex] += tx.value;
        }
      }
    });

    let datasets: any[] = [];
    if (selectedType === 'Receita' || selectedType === ALL_FILTER) {
      datasets.push({
        label: 'Receitas (R$)',
        data: dataReceitas,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        fill: true,
      });
    }
    if (selectedType === 'Despesa' || selectedType === ALL_FILTER) {
      datasets.push({
        label: 'Despesas (R$)',
        data: dataDespesas,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
        fill: true,
      });
    }
    // Se 'Todas (Saldo)' for selecionado, adicionamos o saldo
    if (selectedType === ALL_FILTER) {
        const dataSaldo = dataReceitas.map((receita, index) => receita - dataDespesas[index]);
        datasets.push({
            label: 'Saldo (R$)',
            data: dataSaldo,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            tension: 0.1,
            fill: false, // Linha sem preenchimento para saldo
            type: 'line', // Garantir que seja linha
            order: 0 // Desenhar por cima
        });
    }

    return { labels, datasets };
  }, [filteredTransactions, startDate, endDate, selectedType]);

  // Dados para Gráfico de Barras (Divisão por Categoria)
  const categoryChartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};

    filteredTransactions.forEach(tx => {
      if (!tx.categoryId) return; // Ignorar transações sem categoria
      const categoryName = getCategoryById(tx.categoryId)?.name ?? 'Sem Categoria';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (tx.type === 'Receita' ? tx.value : -tx.value);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    return {
      labels,
      datasets: [
        {
          label: `Valor (${selectedType === 'all' ? 'Saldo' : selectedType}) por Categoria (R$)`,
          data,
          backgroundColor: labels.map((_, i) => `hsl(${(i * 360 / labels.length) % 360}, 70%, 60%)`), // Cores dinâmicas
        },
      ],
    };
  }, [filteredTransactions, selectedType, getCategoryById]);

  // --- Opções dos Gráficos ---
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Evolução Financeira por Mês' },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: { y: { beginAtZero: true } }
  };

  const barChartOptions = {
    indexAxis: 'y' as const, // Barras horizontais para melhor leitura dos nomes
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }, // Legenda geralmente desnecessária aqui
        title: { display: true, text: `Distribuição por Categoria Financeira` },
        tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: { x: { beginAtZero: true } }
  };

  // Handler para mudança de status (checkbox)
  const handleStatusChange = (status: TransactionStatus) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // --- Renderização ---
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>

        {/* --- Seção de Filtros --- */}
        <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro de Data */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 flex items-center space-x-2">
            <DatePicker
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
            <span>até</span>
            <DatePicker
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

          {/* Filtro Tipo */}
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            >
              {transactionTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro Categoria */}
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value={ALL_FILTER}>Todas</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro Médico */}
          <div>
            <label htmlFor="doctorFilter" className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
            <select
              id="doctorFilter"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value={ALL_FILTER}>Todos</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro Status */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
             <div className="flex flex-wrap gap-x-4 gap-y-2">
               {statusOptions.map(status => (
                 <div key={status} className="flex items-center">
                   <input
                     id={`status-${status}`}
                     type="checkbox"
                     checked={selectedStatus.includes(status)}
                     onChange={() => handleStatusChange(status)}
                     className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                   />
                   <label htmlFor={`status-${status}`} className="ml-2 block text-sm text-gray-900">
                     {status}
                   </label>
                 </div>
               ))}
                <button
                    onClick={() => setSelectedStatus([])}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline disabled:text-gray-400 disabled:no-underline"
                    disabled={selectedStatus.length === 0}
                >
                    Limpar Status
                </button>
             </div>
          </div>
        </div>

        {/* --- Seção de Gráficos --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha - Evolução Mensal */}
          <div className="bg-white p-4 rounded shadow h-96">
            <Line options={lineChartOptions} data={monthlyChartData as any} />
          </div>

          {/* Gráfico de Barras - Por Categoria */}
          <div className="bg-white p-4 rounded shadow h-96">
            <Bar options={barChartOptions} data={categoryChartData} />
          </div>
        </div>

        {/* --- Tabela de Transações Filtradas (Opcional, para ver detalhes) --- */}
        {/* 
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
           <h2 className="text-xl font-semibold mb-4">Transações Filtradas</h2>
           <table className="min-w-full divide-y divide-gray-200">
             <thead> 
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
               </tr>
              </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {filteredTransactions.length > 0 ? (
                 filteredTransactions.map(tx => (
                   <tr key={tx.id}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.description}</td>
                     <td className={`px-6 py-4 whitespace-nowrap text-sm ${tx.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>R$ {tx.amount.toFixed(2)}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.type}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.status}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(tx.paymentDate ?? tx.dueDate), 'dd/MM/yyyy')}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryById(tx.categoryId)?.name ?? '-'}</td>
                   </tr>
                 ))
               ) : (
                 <tr><td colSpan={6} className="text-center py-4 text-gray-500">Nenhuma transação encontrada para os filtros selecionados.</td></tr>
               )}
              </tbody>
           </table>
        </div>
        */}
      </div>
    </DashboardLayout>
  );
} 