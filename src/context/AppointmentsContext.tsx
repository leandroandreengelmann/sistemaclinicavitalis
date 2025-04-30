'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appointment, FinancialTransaction, Patient, Doctor } from '@/types/index';
import initialAppointmentsData from '@/data/initialAppointments.json';
import { useFinancials } from './FinancialContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Importar dados para nomes (idealmente viriam de um lugar centralizado ou API)
import patientsData from '@/data/patients.json';
import doctorsData from '@/data/doctors.json';

// Chave para usar no localStorage
const LOCAL_STORAGE_KEY = 'clinicAppointments';

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (newAppointment: Appointment) => void;
  updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (appointmentId: string) => void;
  getAppointmentById: (appointmentId: string) => Appointment | undefined;
  clearAllAppointments: () => void;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(
  undefined
);

interface AppointmentsProviderProps {
  children: ReactNode;
}

export const AppointmentsProvider: React.FC<AppointmentsProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Estado para carregamento inicial
  const { addTransaction } = useFinancials(); // Usar contexto financeiro

  // Carregar pacientes e médicos para referência de nomes
  const patients: Patient[] = patientsData;
  const doctors: Doctor[] = doctorsData;

  // Carrega dados iniciais (localStorage ou JSON)
  useEffect(() => {
    let dataToSet: Appointment[] = [];
    try {
      const storedAppointments = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedAppointments) {
        dataToSet = JSON.parse(storedAppointments);
      } else {
        // Se não houver nada no localStorage, usa os dados iniciais do JSON
        dataToSet = initialAppointmentsData as Appointment[];
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos do localStorage:", error);
      // Fallback para dados iniciais em caso de erro
      dataToSet = initialAppointmentsData as Appointment[];
    }

    // Mapeia para adicionar extendedProps ANTES de definir o estado
    const appointmentsWithExtendedProps = dataToSet.map(app => ({
        ...app,
        extendedProps: {
            ...(app.extendedProps || {}), // Preserva outros extendedProps se houver
            doctorId: app.doctorId, // Garante que doctorId está em extendedProps
            patientId: app.patientId // Garante que patientId está em extendedProps
        }
    }));

    setAppointments(appointmentsWithExtendedProps);
    setIsLoading(false); // Terminou o carregamento
  }, []);

  // Salva no localStorage sempre que 'appointments' mudar
  useEffect(() => {
    // Não salva durante o carregamento inicial
    if (!isLoading) {
       try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appointments));
       } catch (error) {
          console.error("Erro ao salvar agendamentos no localStorage:", error);
       }
    }
  }, [appointments, isLoading]);

  const addAppointment = (newAppointmentWithProps: Appointment) => {
    // Garantir que extendedProps e status inicial existem
    const appointmentToAdd = {
      ...newAppointmentWithProps,
      status: newAppointmentWithProps.status || 'Confirmado', // Status inicial padrão
      priority: newAppointmentWithProps.priority || 'Média', // <-- PRIORIDADE PADRÃO
      extendedProps: {
          ...(newAppointmentWithProps.extendedProps || {}),
          doctorId: newAppointmentWithProps.doctorId,
          patientId: newAppointmentWithProps.patientId
      }
    };
    setAppointments((prevAppointments) => [...prevAppointments, appointmentToAdd]);
  };

  const updateAppointment = (appointmentId: string, updates: Partial<Appointment>) => {
    const originalAppointment = appointments.find(app => app.id === appointmentId);
    if (!originalAppointment) {
      console.error(`Agendamento ${appointmentId} não encontrado para atualização.`);
      toast.error("Erro ao encontrar agendamento para atualizar.");
      return;
    }

    const updatedAppointment = { ...originalAppointment, ...updates };

    // --- Lógica para criar Receita --- 
    if (
      updates.status === 'Finalizado' && 
      originalAppointment.status !== 'Finalizado' &&
      updatedAppointment.value && 
      updatedAppointment.value > 0
    ) {
      try {
        const patientName = patients.find(p => p.id === updatedAppointment.patientId)?.name || 'Paciente Desconhecido';
        const doctorName = doctors.find(d => d.id === updatedAppointment.doctorId)?.name || 'Médico Desconhecido';
        const formattedDate = format(new Date(updatedAppointment.end), 'dd/MM/yyyy');

        const newTransaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
          type: 'Receita',
          description: `Consulta Finalizada - ${patientName} com Dr(a). ${doctorName} em ${formattedDate}`,
          categoryId: 'consulta-servico', // <-- Usar ID de categoria real!
          value: updatedAppointment.value,
          dueDate: updatedAppointment.end.split('T')[0],
          paymentDate: undefined,
          paymentMethod: undefined,
          // Passar explicitamente undefined se não houver valor
          patientId: updatedAppointment.patientId ? updatedAppointment.patientId : undefined,
          doctorId: updatedAppointment.doctorId ? updatedAppointment.doctorId : undefined,
          notes: `Receita gerada automaticamente a partir do agendamento ID: ${appointmentId}`
        };

        addTransaction(newTransaction);
        toast.success('Receita gerada automaticamente no financeiro.');

      } catch (error) {
        console.error("Erro ao gerar receita automática:", error);
        toast.error('Falha ao gerar receita automática.');
        // Continuar com a atualização do agendamento mesmo se a receita falhar?
        // Depende da regra de negócio. Aqui, vamos continuar.
      }
    }
    // --- Fim da Lógica da Receita ---

    setAppointments((prevAppointments) =>
      prevAppointments.map((app) =>
        app.id === appointmentId ? updatedAppointment : app
      )
    );
  };

  const deleteAppointment = (appointmentId: string) => {
    setAppointments((prevAppointments) => 
      prevAppointments.filter((app) => app.id !== appointmentId)
    );
  };

  const getAppointmentById = (appointmentId: string): Appointment | undefined => {
    return appointments.find(app => app.id === appointmentId);
  };

  // --- NOVA FUNÇÃO --- 
  const clearAllAppointments = () => {
    try {
      setAppointments([]); // Limpa o estado
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Limpa o localStorage
      toast.success("Todos os agendamentos foram removidos.");
    } catch (error) {
      console.error("Erro ao limpar todos os agendamentos:", error);
      toast.error("Falha ao remover todos os agendamentos.");
    }
  };
  // -----------------

  // Não renderiza children até carregar os dados para evitar flickering
  if (isLoading) {
    return <div>Carregando agendamentos...</div>; // Ou um spinner
  }

  return (
    <AppointmentsContext.Provider value={{ 
      appointments, 
      addAppointment, 
      updateAppointment, 
      deleteAppointment, 
      getAppointmentById, 
      clearAllAppointments
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = (): AppointmentsContextType => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}; 