'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appointment } from '@/types';
import initialAppointmentsData from '@/data/initialAppointments.json';

// Chave para usar no localStorage
const LOCAL_STORAGE_KEY = 'clinicAppointments';

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (newAppointment: Appointment) => void;
  updateAppointment: (updatedAppointment: Appointment) => void;
  deleteAppointment: (appointmentId: string) => void;
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
    setAppointments((prevAppointments) => [...prevAppointments, newAppointmentWithProps]);
  };

  const updateAppointment = (updatedAppointmentWithProps: Appointment) => {
    setAppointments((prevAppointments) =>
      prevAppointments.map((app) =>
        app.id === updatedAppointmentWithProps.id ? updatedAppointmentWithProps : app
      )
    );
  };

  const deleteAppointment = (appointmentId: string) => {
    setAppointments((prevAppointments) => 
      prevAppointments.filter((app) => app.id !== appointmentId)
    );
  };

  // Não renderiza children até carregar os dados para evitar flickering
  if (isLoading) {
    return <div>Carregando agendamentos...</div>; // Ou um spinner
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, updateAppointment, deleteAppointment }}>
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