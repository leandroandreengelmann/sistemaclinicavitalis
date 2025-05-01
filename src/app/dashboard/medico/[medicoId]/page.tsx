'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppointments } from '@/context/AppointmentsContext';
import { Appointment, Patient } from '@/types/index'; // Doctor não é mais necessário aqui
import patientsData from '@/data/patients.json';
// doctorsData não é mais necessário aqui
import { format, isToday } from 'date-fns'; // isPast não é mais necessário aqui
import toast from 'react-hot-toast'; 
import { 
  CalendarDaysIcon, 
  ArchiveBoxIcon, // Reutilizado para Histórico do Dia
  PhoneIcon,
  TagIcon
  // UserCircleIcon, ClipboardDocumentListIcon, etc não são mais necessários aqui
} from '@heroicons/react/24/outline';

// --- Componentes Internos ---

// Função Helper para Cor do Badge de Status (mantida)
const getStatusBadgeColor = (status?: string): string => {
  const lowerStatus = status?.toLowerCase(); 
  switch (lowerStatus) {
    case 'confirmado':
      return 'bg-green-100 text-green-800';
    case 'em atendimento':
      return 'bg-yellow-100 text-yellow-800';
    case 'finalizado':
      return 'bg-blue-100 text-blue-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Componente AgendamentosDoDia (mantido, sem alterações internas)
const AgendamentosDoDia = ({ medicoId }: { medicoId: string }) => {
  const { appointments, updateAppointment } = useAppointments(); 
  const router = useRouter();
  const patients: Patient[] = patientsData;
  const hoje = new Date();
  
  const agendamentosDeHoje = appointments
    .filter(app => {
      const isMedicoCorreto = app.doctorId === medicoId;
      if (!isMedicoCorreto) return false;
      try {
        const dataAgendamento = new Date(app.start);
        return isToday(dataAgendamento);
      } catch (error) {
        console.error("Erro ao converter data do agendamento:", app.start, error);
        return false;
      }
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const getPacienteInfo = (patientId: string): Patient | undefined => {
    return patients.find(p => p.id === patientId);
  };

  const handleVerProntuario = (patientId: string) => {
      alert(`Funcionalidade "Ver Prontuário" para paciente ${patientId} ainda não implementada completamente.`);
  };

  const handleIniciarAtendimento = (appointmentId: string) => {
    try {
      updateAppointment(appointmentId, { status: 'Em Atendimento' }); 
      router.push(`/dashboard/atendimento/${appointmentId}`);
    } catch (error) {
       console.error("Erro ao iniciar atendimento:", error);
       toast.error('Falha ao iniciar o atendimento.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
       <h2 className="text-xl font-semibold mb-4 flex items-center">
         <CalendarDaysIcon className="h-6 w-6 mr-2 text-indigo-600" />
         Meus Agendamentos de Hoje ({format(hoje, 'dd/MM/yyyy')})
       </h2>
      {agendamentosDeHoje.length === 0 ? (
        <p className="text-gray-600 pl-8">Você não tem agendamentos para hoje.</p>
      ) : (
        <ul className="space-y-4">
          {agendamentosDeHoje.map(app => {
            const paciente = getPacienteInfo(app.patientId);
            const podeIniciar = !['em atendimento', 'finalizado', 'cancelado'].includes(app.status?.toLowerCase() || '');
            const emAtendimento = app.status?.toLowerCase() === 'em atendimento';
            
            return (
              <li key={app.id} className="p-4 bg-gray-50 rounded border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-1 space-y-1">
                  <div className="font-medium text-lg">{format(new Date(app.start), 'HH:mm')}</div>
                  <div className="text-gray-800 font-medium">{paciente ? paciente.name : 'Paciente não encontrado'}</div>
                  {paciente?.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                       <PhoneIcon className="h-4 w-4 mr-1" /> 
                       {paciente.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <TagIcon className="h-4 w-4 mr-1 text-gray-500" />
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(app.status)}`}>
                       {app.status || 'Não definido'}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 items-start sm:items-center">
                  {paciente && (
                     <button 
                       onClick={() => handleVerProntuario(paciente.id)} 
                       className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                       title="Abrir prontuário deste paciente"
                     >
                       Ver Prontuário
                     </button>
                  )}
                  {podeIniciar && (
                     <button 
                       onClick={() => handleIniciarAtendimento(app.id)} 
                       className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                       title="Iniciar atendimento e ir para tela de prontuário"
                     >
                       Iniciar Atendimento
                     </button>
                  )}
                   {emAtendimento && (
                     <button 
                       onClick={() => router.push(`/dashboard/atendimento/${app.id}`)} 
                       className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                       title="Continuar o atendimento em andamento"
                     >
                       Continuar Atendimento
                     </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// << NOVO COMPONENTE >>
const HistoricoDoDia = ({ medicoId }: { medicoId: string }) => {
  const { appointments } = useAppointments();
  const patients: Patient[] = patientsData;
  const hoje = new Date();

  // Filtrar agendamentos finalizados HOJE para o médico
  const atendimentosFinalizadosHoje = appointments
    .filter(app => {
      const isMedicoCorreto = app.doctorId === medicoId;
      if (!isMedicoCorreto) return false;

      const isFinalizado = app.status === 'Finalizado';
      if (!isFinalizado) return false;

      // Verifica se a data de término é HOJE
      try {
        // IMPORTANTE: Usar app.end aqui, não app.start
        if (!app.end) return false; // Garante que app.end existe
        const dataTermino = new Date(app.end);
        return isToday(dataTermino); // <- Mudança principal aqui
      } catch (error) {
        console.error("Erro ao converter data de término do agendamento:", app.end, error);
        return false;
      }
    })
    .sort((a, b) => new Date(b.end!).getTime() - new Date(a.end!).getTime()); // Ordenar por hora de término

  const getNomePaciente = (patientId: string) => {
    const paciente = patients.find(p => p.id === patientId);
    return paciente ? paciente.name : 'Paciente não encontrado';
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <ArchiveBoxIcon className="h-6 w-6 mr-2 text-indigo-600" />
        Atendimentos Finalizados Hoje ({format(hoje, 'dd/MM/yyyy')})
      </h2>
      {atendimentosFinalizadosHoje.length === 0 ? (
        <p className="text-gray-600 pl-8">Nenhum atendimento finalizado hoje.</p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {atendimentosFinalizadosHoje.map(app => (
            <li key={app.id} className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="font-medium">{format(new Date(app.end!), 'HH:mm')}</span> - 
              <span> {getNomePaciente(app.patientId)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Componentes removidos: HistoricoAtendimentos (antigo), PerfilMedico, EditProfileModal, ProntuarioSimplificado

// --- Página Principal do Dashboard do Médico (Visão Geral) ---
interface MedicoDashboardPageProps {
  params: Promise<{
    medicoId: string;
  }>;
}

export default function MedicoDashboardPage({ params }: MedicoDashboardPageProps) {
  const router = useRouter();
  const paramsObj = useParams();
  const medicoId = paramsObj.medicoId as string;

  if (!medicoId) {
     return <div className="p-4 text-red-500">Erro: ID do Médico não fornecido na URL.</div>;
  }
  
  return (
    <div className="space-y-6"> 
      {/* Removido o título H1 daqui, pois o layout já deve ter um */}
      <AgendamentosDoDia medicoId={medicoId} />
      <HistoricoDoDia medicoId={medicoId} />
    </div>
  );
} 