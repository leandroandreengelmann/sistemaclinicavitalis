'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HealthPlanList from '@/components/dashboard/healthplans/HealthPlanList';
import { useHealthPlans } from '@/context/HealthPlansContext';

export default function ManageHealthPlansPage() {
  const { healthPlans, deleteHealthPlan, isLoading } = useHealthPlans();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Gerenciar Planos de Saúde</h1>
          <Link 
            href="/dashboard/healthplans/new" 
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Adicionar Novo Plano
          </Link>
        </div>
        {isLoading && (
            <div className="text-center py-10"><p className="text-gray-500">Carregando planos...</p></div>
        )}
        {!isLoading && (
          <HealthPlanList healthPlans={healthPlans} onDelete={deleteHealthPlan} />
        )}
      </div>
    </DashboardLayout>
  );
} 