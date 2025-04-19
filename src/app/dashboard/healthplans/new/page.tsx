'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HealthPlanForm from '@/components/dashboard/healthplans/HealthPlanForm';
import { useHealthPlans } from '@/context/HealthPlansContext';
import { HealthPlan } from '@/types/index';
import toast from 'react-hot-toast';

export default function NewHealthPlanPage() {
  const router = useRouter();
  const { addHealthPlan } = useHealthPlans();

  const handleSave = (formData: Omit<HealthPlan, 'id'>) => {
    try {
      addHealthPlan(formData);
      toast.success(`Plano ${formData.name} adicionado com sucesso!`);
      router.push('/dashboard/healthplans'); // Volta para a lista
    } catch (error) {
      console.error("Erro ao adicionar plano de saúde:", error);
      toast.error("Ocorreu um erro ao adicionar o plano de saúde.");
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/healthplans'); // Volta para a lista
  };

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl font-semibold">Adicionar Novo Plano de Saúde</h1>
                 <button 
                    onClick={handleCancel}
                    className="text-sm text-gray-600 hover:text-gray-800"
                 >
                    &larr; Voltar para Planos
                 </button>
             </div>
             <HealthPlanForm 
                initialData={null} 
                onSave={handleSave} 
                onClose={handleCancel}
            />
           </div>
       </div>
    </DashboardLayout>
  );
} 