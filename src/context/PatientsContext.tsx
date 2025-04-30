'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import initialPatientsData from '@/data/patients.json';
import { v4 as uuidv4 } from 'uuid';

// Interface para representar um paciente
export interface Patient {
  id: string;
  name: string;
  birthDate: string; // Ou Date?
  gender?: string;
  cpf?: string;
  rg?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientsContextType {
  patients: Patient[];
  addPatient: (patientData: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, patientData: Partial<Omit<Patient, 'id'>>) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  isLoading: boolean;
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

export const PatientsProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais do JSON
  useEffect(() => {
    // Simula carregamento (poderia ser fetch de API)
    try {
      // Adiciona IDs únicos se não existirem (opcional, mas bom para consistência)
      // Verifica se o ID já existe antes de gerar um novo
      const patientsWithIds = (initialPatientsData as Array<Partial<Patient> & Omit<Patient, 'id'>>).map(patient => ({
        ...patient,
        id: patient.id || uuidv4() // Usa ID existente ou gera um novo
      })) as Patient[]; // Garante o tipo correto
      setPatients(patientsWithIds);
    } catch (error) { 
      console.error("Erro ao carregar dados iniciais de pacientes:", error);
      // Definir um estado de erro aqui se necessário
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Adicionar Paciente
  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: uuidv4(), // Gera um novo ID único
    };
    setPatients(prevPatients => [...prevPatients, newPatient]);
    // Aqui você poderia adicionar lógica para salvar no backend/localStorage
  };

  // Atualizar Paciente
  const updatePatient = (id: string, patientData: Partial<Omit<Patient, 'id'>>) => {
    setPatients(prevPatients =>
      prevPatients.map(patient =>
        patient.id === id ? { ...patient, ...patientData } : patient
      )
    );
    // Lógica de salvar no backend/localStorage
  };

  // Deletar Paciente
  const deletePatient = (id: string) => {
    setPatients(prevPatients => prevPatients.filter(patient => patient.id !== id));
    // Lógica de salvar no backend/localStorage
  };

  // Buscar Paciente por ID
  const getPatientById = (id: string): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  };

  return (
    <PatientsContext.Provider 
      value={{ patients, addPatient, updatePatient, deletePatient, getPatientById, isLoading }}
    >
      {children}
    </PatientsContext.Provider>
  );
};

// Hook para usar o contexto
export const usePatients = () => {
  const context = useContext(PatientsContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
}; 