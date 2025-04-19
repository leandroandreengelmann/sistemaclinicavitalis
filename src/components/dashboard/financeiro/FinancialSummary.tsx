'use client';

import { useMemo } from 'react';
import { FinancialTransaction } from '@/types';

interface Props {
  transactions: FinancialTransaction[];
}

// Helper para formatar moeda (pode ser movido para utils se usado em mais lugares)
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function FinancialSummary({ transactions }: Props) {

  // Calcula os totais usando useMemo para otimização
  const summary = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalPagoRecebido = 0; // Soma do que foi efetivamente pago/recebido
    let totalPendente = 0; // Soma do que está pendente ou atrasado
    let saldoPrevisto = 0; // Saldo considerando tudo (pago/pendente/atrasado)
    let saldoRealizado = 0; // Saldo considerando apenas o que foi pago/recebido

    transactions.forEach(tx => {
      if (tx.type === 'Receita') {
        totalReceitas += tx.value;
        if (tx.status === 'Recebido') {
          totalPagoRecebido += tx.value;
        } else if (tx.status === 'Pendente' || tx.status === 'Atrasado') {
          totalPendente += tx.value;
        }
      } else if (tx.type === 'Despesa') {
        totalDespesas += tx.value;
         if (tx.status === 'Pago') {
          totalPagoRecebido -= tx.value; // Subtrai despesas pagas do realizado
        } else if (tx.status === 'Pendente' || tx.status === 'Atrasado') {
          totalPendente -= tx.value; // Subtrai despesas pendentes/atrasadas do pendente
        }
      }
    });

    saldoPrevisto = totalReceitas - totalDespesas;
    // saldoRealizado foi calculado diretamente na iteração somando receitas recebidas e subtraindo despesas pagas.
    // saldoPendente: o que ainda falta entrar/sair
    const saldoPendente = totalPendente;


    return {
      totalReceitas,
      totalDespesas,
      saldoPrevisto, // Saldo considerando todas as transações listadas
      saldoRealizado: totalPagoRecebido, // Saldo apenas das transações concretizadas (Pagas/Recebidas)
      saldoPendente // Quanto ainda está pendente/atrasado (positivo = a receber, negativo = a pagar)
    };
  }, [transactions]); // Recalcula apenas se as transações mudarem

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card Saldo Realizado */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg shadow-md flex flex-col justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-indigo-100">Saldo Realizado</h3>
        <p className={`text-2xl font-bold mt-1 ${summary.saldoRealizado >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatCurrency(summary.saldoRealizado)}
        </p>
        <p className="text-xs text-indigo-200 mt-2">Recebido - Pago</p>
      </div>

      {/* Card Saldo Previsto */}
       <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">Saldo Previsto</h3>
         <p className={`text-2xl font-semibold mt-1 ${summary.saldoPrevisto >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
           {formatCurrency(summary.saldoPrevisto)}
         </p>
         <p className="text-xs text-gray-400 mt-2">Total Receitas - Total Despesas (no filtro)</p>
       </div>

      {/* Card Pendente/Atrasado */}
       <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col justify-between">
         <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">A Pagar / Receber</h3>
         <p className={`text-2xl font-semibold mt-1 ${summary.saldoPendente >= 0 ? 'text-yellow-600' : 'text-orange-600'}`}>
           {formatCurrency(summary.saldoPendente)}
         </p>
         <p className="text-xs text-gray-400 mt-2">Valor Pendente + Atrasado (no filtro)</p>
       </div>

       {/* Poderia adicionar mais cards, como Total Receitas e Total Despesas separadamente se quisesse */}
       {/*
       <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg shadow-sm">
           <h3 className="text-sm font-medium uppercase tracking-wide text-emerald-600">Total Receitas</h3>
           <p className="text-2xl font-semibold mt-1 text-emerald-700">{formatCurrency(summary.totalReceitas)}</p>
       </div>
       <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg shadow-sm">
           <h3 className="text-sm font-medium uppercase tracking-wide text-rose-600">Total Despesas</h3>
           <p className="text-2xl font-semibold mt-1 text-rose-700">{formatCurrency(summary.totalDespesas)}</p>
       </div>
        */}
    </div>
  );
} 