'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Doctor } from '@/types/index'; // Importar o tipo Doctor
import initialDoctorsData from '@/data/doctors.json'; // Dados iniciais

const LOCAL_STORAGE_KEY = 'clinicDoctors'; // Chave para localStorage

interface DoctorsContextType {
  doctors: Doctor[];
  isLoading: boolean;
  addDoctor: (newDoctorData: Omit<Doctor, 'id'>) => void;
  updateDoctor: (doctorId: string, updates: Partial<Omit<Doctor, 'id'>>) => void; // Permitir atualizações parciais
  deleteDoctor: (doctorId: string) => void;
  getDoctorById: (doctorId: string) => Doctor | undefined;
}

const DoctorsContext = createContext<DoctorsContextType | undefined>(undefined);

interface DoctorsProviderProps {
  children: ReactNode;
}

export const DoctorsProvider: React.FC<DoctorsProviderProps> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais (localStorage ou JSON)
  useEffect(() => {
    try {
      const storedDoctors = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDoctors) {
        setDoctors(JSON.parse(storedDoctors));
      } else {
        setDoctors(initialDoctorsData as Doctor[]);
      }
    } catch (error) {
      console.error("Erro ao carregar médicos do localStorage:", error);
      setDoctors(initialDoctorsData as Doctor[]); // Fallback
    }
    setIsLoading(false);
  }, []);

  // Salvar no localStorage sempre que 'doctors' mudar
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(doctors));
      } catch (error) {
        console.error("Erro ao salvar médicos no localStorage:", error);
      }
    }
  }, [doctors, isLoading]);

  const addDoctor = (newDoctorData: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = {
      id: `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`, // ID único
      ...newDoctorData,
    };
    setDoctors((prev) => [...prev, newDoctor]);
  };

  const updateDoctor = (doctorId: string, updates: Partial<Omit<Doctor, 'id'>>) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === doctorId ? { ...doc, ...updates } : doc
      )
    );
  };

  const deleteDoctor = (doctorId: string) => {
    setDoctors((prev) => prev.filter((doc) => doc.id !== doctorId));
  };

  const getDoctorById = (doctorId: string): Doctor | undefined => {
    return doctors.find(doc => doc.id === doctorId);
  };

  // Simples estado de carregamento
  if (isLoading) {
    return <div>Carregando médicos...</div>; // Pode ser um spinner global
  }

  return (
    <DoctorsContext.Provider value={{ doctors, isLoading, addDoctor, updateDoctor, deleteDoctor, getDoctorById }}>
      {children}
    </DoctorsContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useDoctors = (): DoctorsContextType => {
  const context = useContext(DoctorsContext);
  if (!context) {
    throw new Error('useDoctors must be used within an DoctorsProvider');
  }
  return context;
}; 