// Esta será a página principal que renderizará o calendário
// e gerenciará o estado do modal de formulário

'use client'; // Necessário para hooks e contexto

import { useState, useEffect } from 'react'; // Manter useState/useEffect se necessário para D&D
import Link from 'next/link';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import AppointmentForm from '@/components/calendar/AppointmentForm';
import AppointmentInfoModal from '@/components/calendar/AppointmentInfoModal';
import { useAppointments } from '@/context/AppointmentsContext';
import { Appointment, Doctor, Patient, AppointmentFormData } from '@/types'; // Manter tipos
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import { DateSelectArg, EventHoveringArg } from '@fullcalendar/core'; // Readicionar tipo
import DashboardLayout from '@/components/dashboard/DashboardLayout'; // Importar o Layout
import { checkAppointmentOverlap } from '@/utils/appointmentUtils'; // Importar
import { v4 as uuidv4 } from 'uuid'; // Importar uuid
import toast from 'react-hot-toast'; // Importar toast

// Mapeamento de Cores por Doctor ID permanece para CustomEventContent
const doctorColorMap: { [key: string]: { bg: string; border: string; text: string } } = {
    'doc1': { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-white' },
    'doc2': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-white' },
    'doc3': { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-white' },
    'doc4': { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white' },
    'doc5': { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-white' },
    'doc6': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-white' },
    'doc7': { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-white' },
    'doc8': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white' },
    'doc9': { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-white' },
    'doc10': { bg: 'bg-lime-500', border: 'border-lime-500', text: 'text-white' },
    'default': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white' }
};

export default function HomePage() {
  const { appointments, addAppointment, updateAppointment } = useAppointments();
  
  // Readicionar estados dos modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null); 

  // Readicionar estados para o modal de hover
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const doctors: Doctor[] = doctorsData;
  const patients: Patient[] = patientsData;

  // Readicionar callback de seleção de slot
  const handleSelectSlot = (selectInfo: DateSelectArg) => {
    if (selectInfo.allDay && selectInfo.view?.type === 'dayGridMonth') {
        console.log("Seleção de dia inteiro ignorada na visualização mensal.");
        return; 
    }
    setEditingAppointment(null); // Garante que não estamos editando
    setSelectedDate(selectInfo.start);
    setIsModalOpen(true);
  };

  // Readicionar callback para fechar modal
   const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setEditingAppointment(null); 
  };

  // Handler usado pelo formulário do calendário
  const handleSave = async (formData: AppointmentFormData, id?: string) => {
    const doctor = doctors.find(d => d.id === formData.doctorId);
    const patient = patients.find(p => p.id === formData.patientId);

    if (!doctor || !patient) {
      toast.error("Erro: Médico ou paciente inválido."); // Usar toast
      return; // Parar aqui
    }

    // *** Adicionar verificação de conflito AQUI ***
    const overlapCheck = checkAppointmentOverlap(
      { 
        start: formData.start,
        end: formData.end,
        doctorId: formData.doctorId,
        patientId: formData.patientId
      },
      appointments,
      id // Passa o ID se estiver editando (vindo do formulário)
    );

    if (overlapCheck.overlap) {
      toast.error(overlapCheck.message || "Conflito de horário detectado.");
      return; // Impede o salvamento
    }
    // *** Fim da verificação ***

    try {
        const appointmentData = {
            title: `${patient.name} / ${doctor.name}`,
            ...formData,
            extendedProps: {
                doctorId: formData.doctorId,
                patientId: formData.patientId
            }
        };

        if (id) { // Atualização (não deveria ocorrer por este fluxo normalmente, mas mantemos)
           const updatedAppointment: Appointment = {
               id,
               ...appointmentData,
               bookingId: editingAppointment?.bookingId // Preservar bookingId
            };
           updateAppointment(updatedAppointment);
           toast.success("Agendamento atualizado!");
        } else { // Criação
            const newAppointment: Appointment = {
                id: `app-${uuidv4()}`,
                ...appointmentData,
            };
            addAppointment(newAppointment);
            toast.success("Agendamento criado com sucesso!");
        }
        handleCloseModal();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        toast.error("Erro ao salvar agendamento.");
        // Não lançar erro aqui para não quebrar o fluxo do form talvez?
    }
  };

  // Manter callbacks de Drag & Drop (simplificados sem isProcessing)
  const handleEventDrop = (dropInfo: any /* EventDropArg */) => {
    const { event, oldEvent } = dropInfo;
    const appointment = appointments.find(a => a.id === event.id);
    
    if (!appointment || !event.start || !event.end) {
      console.error("Dados inválidos para event drop");
      toast.error("Erro interno ao mover agendamento.");
      dropInfo.revert();
      return;
    }

    // Construir o slot proposto com os novos horários
    const proposedSlot = { 
        start: event.start,
        end: event.end,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId
    };

    // *** Verificar conflito ANTES de tentar atualizar ***
    const overlapCheck = checkAppointmentOverlap(
      proposedSlot,
      appointments,
      event.id // ID do agendamento sendo movido
    );

    if (overlapCheck.overlap) {
      toast.error(overlapCheck.message || "Conflito de horário ao mover.");
      dropInfo.revert(); // Reverte a ação no calendário
      return; // Para a execução
    }
    // *** Fim da verificação ***

    // Se não houve conflito, prosseguir com a atualização
    const updatedAppointment: Appointment = {
      ...appointment,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      extendedProps: appointment.extendedProps // Manter extendedProps original
    };
    try {
      updateAppointment(updatedAppointment);
      toast.success("Agendamento movido!");
    } catch (error) {
       console.error("Erro ao atualizar via drop:", error);
       toast.error("Erro ao salvar a nova posição do agendamento.");
       dropInfo.revert(); 
    }
  };

  const handleEventResize = (resizeInfo: any /* EventResizeDoneArg */) => {
    const { event } = resizeInfo;
    const appointment = appointments.find(a => a.id === event.id);

    if (!appointment || !event.start || !event.end) {
      console.error("Dados inválidos para event resize");
      toast.error("Erro interno ao redimensionar agendamento.");
      resizeInfo.revert();
      return;
    }

    // Construir o slot proposto com os novos horários
    const proposedSlot = { 
        start: event.start,
        end: event.end,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId
    };

    // *** Verificar conflito ANTES de tentar atualizar ***
    const overlapCheck = checkAppointmentOverlap(
        proposedSlot,
        appointments,
        event.id // ID do agendamento sendo redimensionado
    );

    if (overlapCheck.overlap) {
        toast.error(overlapCheck.message || "Conflito de horário ao redimensionar.");
        resizeInfo.revert(); // Reverte a ação no calendário
        return; // Para a execução
    }
    // *** Fim da verificação ***

    // Se não houve conflito, prosseguir com a atualização
    const updatedAppointment: Appointment = {
      ...appointment,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      extendedProps: appointment.extendedProps
    };
    try {
      updateAppointment(updatedAppointment);
      toast.success("Duração do agendamento atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar via resize:", error);
      toast.error("Erro ao salvar o novo tamanho do agendamento.");
      resizeInfo.revert();
    }
  };

  // Readicionar callbacks de hover
  const handleEventMouseEnter = (mouseEnterInfo: EventHoveringArg) => {
    const appointment = appointments.find(app => app.id === mouseEnterInfo.event.id);
    if (appointment) {
      setHoveredAppointment(appointment);
      setModalPosition({ x: mouseEnterInfo.jsEvent.clientX, y: mouseEnterInfo.jsEvent.clientY });
    }
  };

  const handleEventMouseLeave = () => {
    setHoveredAppointment(null);
  };

  return (
    // Envolver com DashboardLayout
    <DashboardLayout>
      {/* Remover classes de layout do main, deixar o DashboardLayout controlar */}
      <main className="flex flex-col items-center">
        {/* Remover link redundante para dashboard, pois estará na sidebar */}
        {/* 
        <div className="self-end mb-4">
          <Link 
            href="/dashboard" 
            className="flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Dashboard
          </Link>
        </div>
        */}

        <h1 className="text-3xl font-bold mb-6 self-start">Calendário de Agendamentos</h1>
        {/* Ajustar altura/largura se necessário após aplicar layout */}
        <div className="w-full h-[calc(100vh-10rem)]"> {/* Tentar altura relativa à viewport menos alguma margem */}
          <AppointmentCalendar
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop} 
            onEventResize={handleEventResize}
            onEventMouseEnter={handleEventMouseEnter}
            onEventMouseLeave={handleEventMouseLeave}
          />
        </div>

        {hoveredAppointment && (
          <AppointmentInfoModal
            appointment={hoveredAppointment}
            position={modalPosition}
            colorClasses={doctorColorMap[hoveredAppointment.doctorId] || doctorColorMap['default']}
          />
        )}

        {isModalOpen && (
          <AppointmentForm
            initialData={editingAppointment}
            selectedDate={selectedDate}
            onSave={handleSave}
            onClose={handleCloseModal}
          />
        )}
      </main>
    </DashboardLayout>
  );
} 