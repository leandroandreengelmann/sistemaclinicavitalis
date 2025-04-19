'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HealthPlanForm from '@/components/dashboard/healthplans/HealthPlanForm';
import { useHealthPlans } from '@/context/HealthPlansContext';
import { HealthPlan } from '@/types/index';
import toast from 'react-hot-toast';

export default function EditHealthPlanPage() {
  const router = useRouter();
  const params = useParams();
  const { getHealthPlanById, updateHealthPlan, isLoading } = useHealthPlans();
  
  const planId = params.planId as string;
  const [initialData, setInitialData] = useState<HealthPlan | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (planId && !isLoading) {
      const plan = getHealthPlanById(planId);
      if (plan) {
        setInitialData(plan);
      } else {
        setNotFound(true);
        toast.error("Plano de saúde não encontrado.");
      }
    }
  }, [planId, isLoading, getHealthPlanById]);

  const handleSave = (formData: Omit<HealthPlan, 'id'>) => {
    if (!initialData) return; 
    try {
      updateHealthPlan(initialData.id, formData);
      toast.success(`Plano ${formData.name} atualizado com sucesso!`);
      router.push('/dashboard/healthplans'); // Volta para a lista
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      toast.error("Ocorreu um erro ao atualizar o plano.");
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/healthplans'); // Volta para a lista
  };

  if (isLoading || (!initialData && !notFound)) {
    return <DashboardLayout><div>Carregando dados do plano...</div></DashboardLayout>;
  }

  if (notFound) {
     return (
        <DashboardLayout>
            <div className="p-6">
                <p className="text-red-500">Plano de saúde não encontrado.</p>
                <button onClick={handleCancel} className="mt-4 text-indigo-600 hover:underline">Voltar para a lista de planos</button>
            </div>
        </DashboardLayout>
     );
  }

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl font-semibold">Editar Plano de Saúde</h1>
                 <button onClick={handleCancel} className="text-sm text-gray-600 hover:text-gray-800">&larr; Voltar para Planos</button>
             </div>
             <HealthPlanForm initialData={initialData} onSave={handleSave} onClose={handleCancel} />
           </div>
       </div>
    </DashboardLayout>
  );
} 