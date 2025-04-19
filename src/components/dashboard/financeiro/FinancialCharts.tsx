'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, // Para Doughnut/Pie
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FinancialTransaction, FinancialCategory } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Função para gerar cores VIVAS variadas
const generateVibrantColor = (index: number): string => {
  const hue = (index * 137.508) % 360; // Golden angle approximation
  // Aumentar Saturação (85%) e diminuir um pouco a Luminosidade (65%) para cores mais vivas
  return `hsla(${hue}, 85%, 65%, 0.85)`; // Cor vibrante com boa opacidade
};

interface FinancialChartsProps {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ transactions, categories }) => {

  // Calcular dados para o gráfico de Barras (Receitas vs Despesas)
  const barChartData = useMemo(() => {
    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'Receita') {
        acc.receitas += tx.value;
      } else if (tx.type === 'Despesa') {
        acc.despesas += tx.value;
      }
      return acc;
    }, { receitas: 0, despesas: 0 });

    return {
      labels: ['Receitas', 'Despesas'],
      datasets: [
        {
          label: 'Total (R$)',
          data: [totals.receitas, totals.despesas],
          backgroundColor: [
            'rgba(22, 163, 74, 0.7)', // Verde Esmeralda Vibrante (bg-emerald-600 com opacidade)
            'rgba(225, 29, 72, 0.7)', // Vermelho Rosa Vibrante (bg-rose-600 com opacidade)
          ],
          borderColor: [
            'rgba(22, 163, 74, 1)', // Verde Esmeralda Sólido
            'rgba(225, 29, 72, 1)', // Vermelho Rosa Sólido
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [transactions]);

  // Calcular dados para o gráfico de Rosca (Despesas por Categoria)
  const doughnutChartData = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'Despesa');
    const expensesByCategory = expenses.reduce((acc, tx) => {
      const categoryName = categories.find(cat => cat.id === tx.categoryId)?.name || 'Sem Categoria';
      acc[categoryName] = (acc[categoryName] || 0) + tx.value;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    // Usar a nova função de cores vibrantes
    const backgroundColors = labels.map((_, index) => generateVibrantColor(index)); 

    if (labels.length === 0) {
       // Se não houver dados, retornar uma estrutura vazia ou padrão
       return {
        labels: ['Nenhuma Despesa Registrada'],
        datasets: [{
          label: 'Despesas por Categoria (R$)',
          data: [1],
          backgroundColor: ['rgba(156, 163, 175, 0.7)'], // Cinza para estado vazio
          borderColor: ['rgba(156, 163, 175, 1)'],
          borderWidth: 1,
        }]
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Despesas por Categoria (R$)',
          data,
          backgroundColor: backgroundColors,
          // Ajustar opacidade da borda para 1 (sólida)
          borderColor: backgroundColors.map(color => color.replace(/,\s*0\.85\)$/, ', 1)')), 
          borderWidth: 1,
        },
      ],
    };
  }, [transactions, categories]);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }, // Ocultar legenda pois os labels já indicam
      title: {
        display: true,
        text: 'Receitas vs. Despesas (Total)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: number | string) {
            return 'R$ ' + Number(value).toLocaleString('pt-BR');
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const, // Posição da legenda
         labels: {
           boxWidth: 12, // Tamanho do quadrado da legenda
           padding: 15 // Espaçamento
         }
      },
      title: {
        display: true,
        text: 'Distribuição de Despesas por Categoria',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
              label += 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ` (${percentage})`;
            }
            return label;
          }
        }
      }
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col items-center">
        {/* <h3 className="text-lg font-semibold mb-4 text-center">Receitas vs. Despesas</h3> */}
        {barChartData.datasets[0].data.some(v => v > 0) ? (
           <Bar options={barOptions} data={barChartData} />
        ) : (
           <p className="text-center text-gray-500 italic mt-4">Sem dados de receitas/despesas para exibir.</p>
        )}
      </div>
      <div className="flex flex-col items-center">
         {/* <h3 className="text-lg font-semibold mb-4 text-center">Despesas por Categoria</h3> */}
         {doughnutChartData.labels[0] !== 'Nenhuma Despesa Registrada' ? (
           <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xs xl:max-w-sm">
             <Doughnut options={doughnutOptions} data={doughnutChartData} />
           </div>
         ) : (
            <p className="text-center text-gray-500 italic mt-4">{doughnutChartData.labels[0]}</p>
         )}
      </div>
    </div>
  );
};

export default FinancialCharts; 