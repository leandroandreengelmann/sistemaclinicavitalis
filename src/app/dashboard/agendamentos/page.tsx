'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AppointmentList from '@/components/dashboard/agendamentos/AppointmentList';
import AppointmentForm from '@/components/calendar/AppointmentForm';
import MultiAppointmentForm from '@/components/dashboard/agendamentos/MultiAppointmentForm';
import { useAppointments } from '@/context/AppointmentsContext';
import { Appointment, Doctor, Patient, AppointmentFormData } from '@/types/index';
import toast from 'react-hot-toast';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import { v4 as uuidv4 } from 'uuid';
import { checkAppointmentOverlap } from '@/utils/appointmentUtils';
import { parseISO, isBefore } from 'date-fns';

export default function ManageAppointmentsPage() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, clearAllAppointments } = useAppointments();

  // Estados para controlar os modais/formulários
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMultiFormOpen, setIsMultiFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | null>(null);

  // Dados necessários em vários locais
  const doctors: Doctor[] = doctorsData;
  const patients: Patient[] = patientsData;

  // --- Handlers para Formulário Simples --- 
  const handleAddNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedDateForNew(new Date());
    setIsMultiFormOpen(false);
    setIsFormOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedDateForNew(null);
    setIsMultiFormOpen(false);
    setIsFormOpen(true);
  };

  const handleSaveAppointment = async (formData: AppointmentFormData, id?: string) => {
    const doctor = doctors.find(d => d.id === formData.doctorId);
    const patient = patients.find(p => p.id === formData.patientId);

    if (!doctor || !patient) {
      toast.error("Erro: Médico ou paciente selecionado é inválido.");
      return;
    }

    const overlapCheck = checkAppointmentOverlap(
      { 
        start: formData.start,
        end: formData.end,
        doctorId: formData.doctorId,
        patientId: formData.patientId
      },
      appointments,
      id
    );

    if (overlapCheck.overlap) {
      toast.error(overlapCheck.message || "Conflito de horário detectado.");
      return;
    }

    try {
      const baseAppointmentData = {
        title: `${patients.find(p => p.id === formData.patientId)?.name || 'P.'} / ${doctors.find(d => d.id === formData.doctorId)?.name || 'Dr.'}`,
        start: formData.start,
        end: formData.end,
        doctorId: formData.doctorId,
        patientId: formData.patientId,
        status: formData.status || 'Scheduled',
        priority: formData.priority || 'Média',
        healthPlanId: formData.healthPlanId || undefined,
        value: formData.value || undefined,
        extendedProps: {
          doctorId: formData.doctorId,
          patientId: formData.patientId
        }
      };

      if (id) {
        const dataToUpdate: Partial<Appointment> = {
          ...baseAppointmentData,
          bookingId: editingAppointment?.bookingId 
        };
        updateAppointment(id, dataToUpdate);
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        const newAppointment: Appointment = {
          id: `app-${uuidv4()}`,
          ...baseAppointmentData,
        };
        addAppointment(newAppointment);
        toast.success("Agendamento criado com sucesso!");
      }
      handleCloseForm();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      toast.error("Ocorreu um erro ao salvar o agendamento.");
    }
  };

  // --- Handlers para Formulário Múltiplo --- 
  const handleOpenMultiForm = () => {
    setIsFormOpen(false);
    setIsMultiFormOpen(true);
  };

  // --- Handler Comum de Exclusão --- 
  const handleDeleteAppointment = (appointmentId: string) => {
    const appointmentToDelete = appointments.find(a => a.id === appointmentId);
    if (!appointmentToDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir o agendamento de ${appointmentToDelete.title}?`)) {
      deleteAppointment(appointmentId);
      toast.success("Agendamento excluído com sucesso!");
    }
  };

  // --- Handler Comum de Fechamento --- 
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsMultiFormOpen(false);
    setEditingAppointment(null);
    setSelectedDateForNew(null);
  };

  // --- Handler para Limpar Todos os Agendamentos --- 
  const handleClearAll = () => {
    if (window.confirm("ATENÇÃO!\n\nTem certeza ABSOLUTA que deseja excluir TODOS os agendamentos?\n\nEsta ação é PERMANENTE e IRREVERSÍVEL.")) {
      clearAllAppointments(); // Chama a função do contexto
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Gestão de Agendamentos</h1>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 mb-6">
          <button
            onClick={handleAddNewAppointment}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm shadow"
          >
            + Novo Agendamento
          </button>
          <button
            onClick={handleOpenMultiForm}
            className="px-4 py-2 bg-teal-600 dark:bg-teal-500 text-white rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors text-sm shadow"
          >
            Agendamento Sequencial (IA)
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm shadow"
            title="Excluir permanentemente TODOS os agendamentos existentes"
          >
            Limpar Todos Agendamentos
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <AppointmentList
            appointments={appointments} 
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
          {appointments.length === 0 && (
            <p className='text-center text-gray-500 dark:text-gray-400 mt-4'>Nenhum agendamento encontrado.</p>
          )}
        </div>

        {isFormOpen && (
          <AppointmentForm 
            initialData={editingAppointment ? editingAppointment : undefined}
            selectedDate={selectedDateForNew}
            onSave={handleSaveAppointment} 
            onClose={handleCloseForm} 
          />
        )}

        {isMultiFormOpen && (
          <MultiAppointmentForm 
            onClose={handleCloseForm} 
          />
        )}

      </div>
    </DashboardLayout>
  );
} 