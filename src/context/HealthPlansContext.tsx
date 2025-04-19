'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { HealthPlan } from '@/types/index'; 
import { v4 as uuidv4 } from 'uuid';

// Definir a interface para o valor do contexto
interface HealthPlansContextType {
  healthPlans: HealthPlan[];
  addHealthPlan: (planData: Omit<HealthPlan, 'id'>) => void;
  updateHealthPlan: (id: string, planData: Partial<Omit<HealthPlan, 'id'>>) => void;
  deleteHealthPlan: (id: string) => void;
  getHealthPlanById: (id: string) => HealthPlan | undefined;
  isLoading: boolean; // Pode ser útil para futuras integrações com API
}

// Criar o contexto com um valor padrão undefined
const HealthPlansContext = createContext<HealthPlansContextType | undefined>(undefined);

// Criar o Provedor do Contexto
export const HealthPlansProvider = ({ children }: { children: ReactNode }) => {
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Começa como true até carregar

  // Efeito para carregar dados (atualmente vazio, mas pronto para API)
  useEffect(() => {
    // Aqui você poderia buscar dados de uma API ou localStorage
    // Exemplo: fetch('/api/healthplans').then(res => res.json()).then(data => setHealthPlans(data));
    setHealthPlans([]); // Inicia vazio por enquanto
    setIsLoading(false);
  }, []);

  // Adicionar Plano de Saúde
  const addHealthPlan = (planData: Omit<HealthPlan, 'id'>) => {
    const newPlan: HealthPlan = {
      ...planData,
      id: uuidv4(), // Gera um novo ID único
    };
    setHealthPlans(prevPlans => [...prevPlans, newPlan]);
    // Lógica para salvar no backend/localStorage aqui
  };

  // Atualizar Plano de Saúde
  const updateHealthPlan = (id: string, planData: Partial<Omit<HealthPlan, 'id'>>) => {
    setHealthPlans(prevPlans =>
      prevPlans.map(plan =>
        plan.id === id ? { ...plan, ...planData } : plan
      )
    );
    // Lógica para salvar no backend/localStorage aqui
  };

  // Deletar Plano de Saúde
  const deleteHealthPlan = (id: string) => {
    setHealthPlans(prevPlans => prevPlans.filter(plan => plan.id !== id));
    // Lógica para salvar no backend/localStorage aqui
  };

  // Buscar Plano de Saúde por ID
  const getHealthPlanById = (id: string): HealthPlan | undefined => {
    return healthPlans.find(plan => plan.id === id);
  };

  // Valor fornecido pelo contexto
  const contextValue: HealthPlansContextType = {
    healthPlans,
    addHealthPlan,
    updateHealthPlan,
    deleteHealthPlan,
    getHealthPlanById,
    isLoading,
  };

  return (
    <HealthPlansContext.Provider value={contextValue}>
      {children}
    </HealthPlansContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useHealthPlans = () => {
  const context = useContext(HealthPlansContext);
  if (context === undefined) {
    throw new Error('useHealthPlans must be used within a HealthPlansProvider');
  }
  return context;
}; 