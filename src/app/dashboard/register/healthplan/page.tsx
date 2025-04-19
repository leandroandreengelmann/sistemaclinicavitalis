'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HealthPlanForm from '@/components/dashboard/healthplans/HealthPlanForm'; // Importa o novo formulário
import { useHealthPlans } from '@/context/HealthPlansContext'; // Importa o novo contexto
import { HealthPlan } from '@/types/index';
import toast from 'react-hot-toast';

export default function RegisterHealthPlanPage() {
  const router = useRouter();
  const { addHealthPlan } = useHealthPlans(); // Usa a função do contexto

  const handleSave = (formData: Omit<HealthPlan, 'id'>) => {
    try {
      addHealthPlan(formData);
      toast.success(`Plano ${formData.name} cadastrado com sucesso!`);
      // Pode redirecionar para a lista de planos ou dashboard
      router.push('/dashboard/healthplans'); 
    } catch (error) {
      console.error("Erro ao cadastrar plano de saúde:", error);
      toast.error("Ocorreu um erro ao cadastrar o plano de saúde.");
    }
  };

  const handleCancel = () => {
    router.push('/dashboard'); // Volta para o dashboard principal
  };

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
          {/* Container para limitar a largura do formulário */}
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl font-semibold">Cadastrar Novo Plano de Saúde</h1>
                 <button 
                    onClick={handleCancel}
                    className="text-sm text-gray-600 hover:text-gray-800"
                 >
                    &larr; Voltar para Dashboard
                 </button>
             </div>
             {/* Renderiza o formulário para adição (initialData=null) */}
             <HealthPlanForm 
                initialData={null} 
                onSave={handleSave} 
                onClose={handleCancel} // Usa onClose para o botão Cancelar
            />
           </div>
       </div>
    </DashboardLayout>
  );
} 