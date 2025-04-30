'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { HealthPlan } from '@/types/index'; 
import { v4 as uuidv4 } from 'uuid';
import initialHealthPlansData from '@/data/healthPlans.json'; // Importar dados iniciais

// Chave para o localStorage
const LOCAL_STORAGE_KEY = 'healthPlansData';

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

  // Efeito para carregar dados do localStorage ou inicializar
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        setHealthPlans(JSON.parse(storedData));
      } else {
        // Se não houver nada no localStorage, usa os dados iniciais e salva lá
        const initialData: HealthPlan[] = initialHealthPlansData; // Especifica o tipo aqui
        setHealthPlans(initialData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
      }
    } catch (error) {
      console.error("Erro ao carregar ou inicializar planos de saúde do localStorage:", error);
      // Em caso de erro, usa os dados iniciais como fallback (sem salvar no localStorage)
      const fallbackData: HealthPlan[] = initialHealthPlansData; // Especifica o tipo aqui também
      setHealthPlans(fallbackData);
    }
    setIsLoading(false);
  }, []);

  // Função auxiliar para salvar no localStorage
  const saveToLocalStorage = (plans: HealthPlan[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error("Erro ao salvar planos de saúde no localStorage:", error);
    }
  };

  // Adicionar Plano de Saúde
  const addHealthPlan = (planData: Omit<HealthPlan, 'id'>) => {
    const newPlan: HealthPlan = {
      ...planData,
      id: uuidv4(),
    };
    setHealthPlans(prevPlans => {
      const updatedPlans = [...prevPlans, newPlan];
      saveToLocalStorage(updatedPlans); // Salva no localStorage
      return updatedPlans;
    });
  };

  // Atualizar Plano de Saúde
  const updateHealthPlan = (id: string, planData: Partial<Omit<HealthPlan, 'id'>>) => {
    setHealthPlans(prevPlans => {
      const updatedPlans = prevPlans.map(plan =>
        plan.id === id ? { ...plan, ...planData } : plan
      );
      saveToLocalStorage(updatedPlans); // Salva no localStorage
      return updatedPlans;
    });
  };

  // Deletar Plano de Saúde
  const deleteHealthPlan = (id: string) => {
    setHealthPlans(prevPlans => {
      const updatedPlans = prevPlans.filter(plan => plan.id !== id);
      saveToLocalStorage(updatedPlans); // Salva no localStorage
      return updatedPlans;
    });
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