'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FinancialCharts from '@/components/dashboard/financeiro/FinancialCharts';
import { useFinancials } from '@/context/FinancialContext';

export default function FinanceiroRelatoriosPage() {
  const { transactions, categories } = useFinancials();

  // Aqui podemos adicionar lógica futura para processar ou filtrar
  // os dados especificamente para os relatórios, se necessário.

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-6">Relatórios Financeiros</h1>

        {transactions.length > 0 ? (
          <FinancialCharts transactions={transactions} categories={categories} />
        ) : (
          <p className="text-center text-gray-500 mt-8">Não há dados suficientes para gerar relatórios.</p>
        )}

        {/* Poderíamos adicionar mais filtros ou opções de relatório aqui no futuro */}
      </div>
    </DashboardLayout>
  );
} 