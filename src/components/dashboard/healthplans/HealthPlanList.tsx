'use client';

import React from 'react';
import Link from 'next/link';
import { HealthPlan } from '@/types/index';
import toast from 'react-hot-toast';

interface HealthPlanListProps {
  healthPlans: HealthPlan[];
  onDelete: (id: string) => void; 
}

const HealthPlanList: React.FC<HealthPlanListProps> = ({ healthPlans, onDelete }) => {

  const handleDeleteClick = (plan: HealthPlan) => {
    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir o plano <br/><b>{plan.name}</b>?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                onDelete(plan.id);
                toast.success(`Plano ${plan.name} excluído com sucesso!`, { id: t.id });
              } catch (error) {
                console.error("Erro ao excluir plano:", error);
                toast.error("Falha ao excluir plano.", { id: t.id });
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </span>
    ), { duration: 8000 });
  };

  if (!healthPlans || healthPlans.length === 0) {
    return <p className="text-center text-gray-500 py-4">Nenhum plano de saúde cadastrado.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Reg.</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {healthPlans.map((plan) => (
            <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.registrationCode || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.phone || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.email || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <Link href={`/dashboard/healthplans/${plan.id}/edit`} className="text-indigo-600 hover:text-indigo-800 hover:underline">Editar</Link>
                <button onClick={() => handleDeleteClick(plan)} className="text-red-600 hover:text-red-800 hover:underline">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HealthPlanList; 