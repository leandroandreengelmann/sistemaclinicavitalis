'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AppointmentList from '@/components/dashboard/agendamentos/AppointmentList';
import AppointmentForm from '@/components/calendar/AppointmentForm';
import MultiAppointmentForm, { AddedSlot } from '@/components/dashboard/agendamentos/MultiAppointmentForm';
import { useAppointments } from '@/context/AppointmentsContext';
import { Appointment, AppointmentFormData, Doctor, Patient } from '@/types';
import toast from 'react-hot-toast';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import { v4 as uuidv4 } from 'uuid';
import { checkAppointmentOverlap } from '@/utils/appointmentUtils';
import { parseISO, isBefore } from 'date-fns';

export default function ManageAppointmentsPage() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();

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
      const appointmentData = {
        title: `${patient.name} / ${doctor.name}`,
        ...formData,
        extendedProps: {
          doctorId: formData.doctorId,
          patientId: formData.patientId
        }
      };
      if (id) {
        const updatedAppointment: Appointment = { 
            id, 
            ...appointmentData, 
            bookingId: editingAppointment?.bookingId
        };
        updateAppointment(updatedAppointment);
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        const newAppointment: Appointment = {
          id: `app-${uuidv4()}`,
          ...appointmentData,
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

  const handleMultiSave = (patientId: string, slots: Omit<AddedSlot, 'slotId' | 'doctorName'>[]) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        toast.error("Erro: Paciente selecionado inválido.");
        return;
    }

    // *** VALIDAÇÃO DE CONFLITOS ANTES DE CRIAR ***
    try {
      for (let i = 0; i < slots.length; i++) {
          const currentSlot = slots[i];

          // 1. Verificar contra agendamentos existentes
          const overlapExistingCheck = checkAppointmentOverlap(
              { ...currentSlot, patientId }, // Adiciona patientId ao slot para verificação completa
              appointments
              // Nenhum ID de atualização, pois estamos sempre criando
          );
          if (overlapExistingCheck.overlap) {
              toast.error(`Conflito no ${i + 1}º horário: ${overlapExistingCheck.message}`);
              return; // Cancela toda a operação
          }

          // 2. Verificar contra outros slots no mesmo lote
          for (let j = i + 1; j < slots.length; j++) {
              const otherSlot = slots[j];
              const currentStart = parseISO(currentSlot.start);
              const currentEnd = parseISO(currentSlot.end);
              const otherStart = parseISO(otherSlot.start);
              const otherEnd = parseISO(otherSlot.end);

              // Verifica sobreposição de tempo
              const timeOverlap = isBefore(currentStart, otherEnd) && isBefore(otherStart, currentEnd);

              if (timeOverlap) {
                  // Verifica conflito de médico ou paciente (paciente é sempre o mesmo aqui)
                  if (currentSlot.doctorId === otherSlot.doctorId || patientId === patientId) { // A segunda condição é sempre true, mas explícita
                      toast.error(`Conflito interno entre o ${i + 1}º e ${j + 1}º horário adicionado.`);
                      return; // Cancela toda a operação
                  }
              }
          }
      }
    } catch(e) {
        // Captura erros do parseISO dentro da validação, se houver
        console.error("Erro durante a validação de horários múltiplos:", e);
        toast.error("Erro ao validar os horários propostos.");
        return;
    }
    // *** FIM DA VALIDAÇÃO ***

    // Se passou por todas as validações, prosseguir com a criação
    const bookingId = `booking-${uuidv4()}`; 
    let createdCount = 0;
    try {
        slots.forEach(slot => {
            const doctor = doctors.find(d => d.id === slot.doctorId);
            // Validação de médico já feita na checagem de overlap implícita, mas podemos manter por segurança
            if (!doctor) { 
                console.warn(`Médico não encontrado para slot ${slot.start} durante a criação. Pulando.`);
                // Não deveria acontecer se a validação passou, mas por segurança
                return; 
            }
            const newAppointment: Appointment = {
                id: `app-${uuidv4()}`,
                title: `${patient.name} / ${doctor.name}`,
                start: slot.start,
                end: slot.end,
                doctorId: slot.doctorId,
                patientId: patientId,
                bookingId: bookingId, 
                extendedProps: {
                    doctorId: slot.doctorId,
                    patientId: patientId
                }
            };
            addAppointment(newAppointment);
            createdCount++;
        });
        if (createdCount > 0) {
            toast.success(`${createdCount} agendamento(s) criado(s) com sucesso para ${patient.name}!`);
        }
        handleCloseForm();
    } catch (error) {
        console.error("Erro ao salvar múltiplos agendamentos:", error);
        toast.error("Ocorreu um erro ao salvar os agendamentos.");
    }
  };

  // --- Handler Comum de Exclusão --- 
  const handleDeleteAppointment = (appointmentId: string) => {
    const appointmentToDelete = appointments.find(a => a.id === appointmentId);
    if (!appointmentToDelete) return;
    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir<br/>o agendamento <b>{appointmentToDelete.title}</b><br/>em {new Date(appointmentToDelete.start).toLocaleString('pt-BR')}?</p>
        <div className="flex gap-2">
          <button onClick={() => { try { deleteAppointment(appointmentId); toast.success(`Agendamento excluído com sucesso!`, { id: t.id }); } catch (error) { console.error("Erro ao excluir agendamento:", error); toast.error("Falha ao excluir agendamento.", { id: t.id }); } }} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Excluir</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400">Cancelar</button>
        </div>
      </span>
    ), { duration: 8000 });
  };

  // --- Handler Comum de Fechamento --- 
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsMultiFormOpen(false);
    setEditingAppointment(null);
    setSelectedDateForNew(null);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold">Gestão de Agendamentos</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleOpenMultiForm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Agendamento Múltiplo
            </button>
            <button 
              onClick={handleAddNewAppointment}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
            >
              Novo Agendamento Único
            </button>
          </div>
        </div>

        <AppointmentList 
          appointments={appointments} 
          onEdit={handleEditAppointment} 
          onDelete={handleDeleteAppointment} 
        />

        {isFormOpen && (
          <AppointmentForm 
            initialData={editingAppointment}
            selectedDate={editingAppointment ? null : selectedDateForNew}
            onSave={handleSaveAppointment}
            onClose={handleCloseForm}
          />
        )}

        {isMultiFormOpen && (
          <MultiAppointmentForm
            onMultiSave={handleMultiSave}
            onClose={handleCloseForm} 
          />
        )}
      </div>
    </DashboardLayout>
  );
} 