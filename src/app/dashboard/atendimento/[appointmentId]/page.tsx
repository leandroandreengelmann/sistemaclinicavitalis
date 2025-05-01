'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppointments } from '@/context/AppointmentsContext';
import { Appointment, Patient } from '@/types/index';
import patientsData from '@/data/patients.json';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
    PencilSquareIcon, 
    ArrowLeftIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    InformationCircleIcon, 
    ClipboardDocumentListIcon
} from '@heroicons/react/24/solid';

// Interface ClinicalNote com campo para correção e motivo
interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; 
  text: string;
  appointmentId?: string; 
  appointmentDate?: string; 
  isCorrectionOf: string | null; 
  correctionReason?: string; // << NOVO CAMPO: Motivo da correção
}
const NOTES_LOCAL_STORAGE_KEY = 'clinicClinicalNotes';

export default function AtendimentoPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const { getAppointmentById, updateAppointment } = useAppointments();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState<string>('');
  const [historicalNotes, setHistoricalNotes] = useState<ClinicalNote[]>([]);
  const [allNotes, setAllNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [correctingNoteId, setCorrectingNoteId] = useState<string | null>(null);
  const [correctionReasonText, setCorrectionReasonText] = useState<string>(''); // << NOVO ESTADO

  const draftNoteKey = `draftNote_${appointmentId}`;

  // 1. Carregar histórico geral de notas (ao montar)
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_LOCAL_STORAGE_KEY);
      if (storedNotes) {
        setAllNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de notas:", error);
    }
  }, []);

  // 2. Carregar dados do agendamento, paciente E o rascunho da nota atual
  useEffect(() => {
    setIsLoading(true);
    const app = getAppointmentById(appointmentId);
    if (app) {
      setAppointment(app);
      const pat = patientsData.find(p => p.id === app.patientId);
      if (pat) {
        setPatient(pat);
        const patientHistory = allNotes
            .filter(note => note.patientId === pat.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistoricalNotes(patientHistory);
      } else {
        toast.error("Paciente não encontrado para este agendamento.");
      }
      if (!correctingNoteId) { 
          try {
            const draftNote = localStorage.getItem(draftNoteKey);
            if (draftNote) {
              setCurrentNoteText(draftNote);
            }
          } catch (error) {
             console.error("Erro ao carregar rascunho da nota:", error);
          }
      }
    } else {
      toast.error("Agendamento não encontrado.");
    }
    setIsLoading(false);
  }, [appointmentId, getAppointmentById, allNotes, draftNoteKey, correctingNoteId]);

  // 3. Salvar rascunho automaticamente no localStorage quando o texto muda
  useEffect(() => {
    if (isLoading || !appointment) return;
    try {
      localStorage.setItem(draftNoteKey, currentNoteText);
    } catch (error) {
       console.error("Erro ao salvar rascunho da nota:", error);
    }
  }, [currentNoteText, draftNoteKey, isLoading, appointment]);

  // Função para iniciar a correção de uma nota
  const handleStartCorrection = (noteToCorrect: ClinicalNote) => {
      setCurrentNoteText(noteToCorrect.text);
      setCorrectingNoteId(noteToCorrect.id);
      toast(`Corrigindo nota de: ${format(new Date(noteToCorrect.date), 'dd/MM/yyyy HH:mm')}`);
      document.getElementById('clinicalNote')?.focus(); 
  }

  // Função para salvar a nota/correção no histórico principal
  const saveCurrentNoteToHistory = (): boolean => {
    if (!patient || !appointment || currentNoteText.trim() === '') {
      console.log('Tentativa de salvar nota vazia ou sem dados necessários.');
      return false;
    }

    // << Validação do Motivo >>
    if (correctingNoteId && correctionReasonText.trim() === '') {
        toast.error('Por favor, informe o motivo da correção.');
        return false;
    }

    const newNote: ClinicalNote = {
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      patientId: patient.id,
      doctorId: appointment.doctorId, 
      appointmentId: appointment.id, 
      appointmentDate: appointment.start,
      date: new Date().toISOString(),
      text: currentNoteText.trim(),
      isCorrectionOf: correctingNoteId,
      correctionReason: correctingNoteId ? correctionReasonText.trim() : undefined, // << Salva o motivo
    };

    try {
      const updatedAllNotes = [...allNotes, newNote];
      setAllNotes(updatedAllNotes);
      localStorage.setItem(NOTES_LOCAL_STORAGE_KEY, JSON.stringify(updatedAllNotes));
      
      if (correctingNoteId) {
          setCorrectingNoteId(null);
          setCurrentNoteText(''); 
          setCorrectionReasonText(''); // << Reseta motivo
          localStorage.removeItem(draftNoteKey);
      }
      
      return true;
    } catch (error) {
       console.error("Erro ao salvar nota:", error);
       toast.error('Falha ao salvar a nota no histórico.');
       return false;
    }
  }

  // Handler para o botão "Salvar Nota" / "Salvar Correção"
  const handleSaveNoteClick = () => {
      if (saveCurrentNoteToHistory()) {
          if (correctingNoteId) {
            toast.success('Correção salva com sucesso!');
          } else {
            toast.success('Nota salva no histórico do paciente!');
          }
      } else {
          toast.error('Não foi possível salvar. Verifique se há conteúdo.');
      }
  }

  // Handler para finalizar o atendimento (SALVA ANTES)
  const handleFinalizarAtendimento = () => {
    if (!appointment) return;
    
    if (!confirm("Tem certeza que deseja finalizar este atendimento? A nota/correção atual será salva no histórico.")) {
        return;
    }

    const saved = saveCurrentNoteToHistory();
    
    if (currentNoteText.trim() === '' || saved) { 
        try {
          updateAppointment(appointment.id, { status: 'Finalizado', end: new Date().toISOString() });
          localStorage.removeItem(draftNoteKey);
          toast.success('Atendimento finalizado com sucesso!');
          router.push(`/dashboard/medico/${appointment.doctorId}`); 
        } catch (error) {
            console.error("Erro ao finalizar atendimento (após salvar nota):", error);
            toast.error('Falha ao finalizar o atendimento.');
        }
    } else {
        toast.error('Erro ao salvar a nota/correção. Não foi possível finalizar o atendimento.');
    }
  };

  // Renderização de Loading ou Erro inicial
  if (isLoading) {
     return <div className="p-6 text-center text-gray-500">Carregando dados do atendimento...</div>;
  }

  if (!appointment || !patient) {
    return (
        <div className="p-6 max-w-lg mx-auto text-center">
            <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-red-600">Erro ao Carregar Atendimento</h1>
            <p className="text-gray-700 mt-2">
                {!appointment ? "Agendamento não encontrado." : "Paciente não encontrado para este agendamento."}
            </p>
            <button 
              onClick={() => router.back()} 
              className="mt-6 inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium shadow-sm transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Voltar
            </button>
        </div>
    );
  }

  // Funções auxiliares de estilo para status
  const getStatusStyles = (status: string | undefined) => {
    switch (status) {
        case 'Agendado': return 'bg-blue-100 text-blue-800';
        case 'Confirmado': return 'bg-green-100 text-green-800';
        case 'Cancelado': return 'bg-red-100 text-red-800';
        case 'Em Atendimento': return 'bg-yellow-100 text-yellow-800';
        case 'Finalizado': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8"> 
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Atendimento - {patient.name}</h1>
      
      {/* Card de Informações - Estilo Melhorado */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden"> 
         <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-yellow-50 to-orange-50"> {/* Gradiente suave */}
             <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                <InformationCircleIcon className="h-6 w-6 mr-2 text-yellow-600"/>
                Informações do Atendimento
             </h2>
         </div>
         <div className="border-t border-gray-200 px-4 py-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
             <div className="text-gray-700">
                <span className="font-medium text-gray-900 block sm:inline">Paciente:</span> 
                <span className="ml-0 sm:ml-1">{patient.name} (ID: {patient.id})</span>
             </div>
             <div className="text-gray-700">
                <span className="font-medium text-gray-900 block sm:inline">Data/Hora:</span> 
                <span className="ml-0 sm:ml-1">{format(new Date(appointment.start), 'dd/MM/yyyy HH:mm')}</span>
             </div>
             {patient.phone && 
                <div className="text-gray-700">
                    <span className="font-medium text-gray-900 block sm:inline">Telefone:</span> 
                    <span className="ml-0 sm:ml-1">{patient.phone}</span>
                </div>
             }
             <div className="text-gray-700 flex items-center">
                <span className="font-medium text-gray-900 mr-2">Status:</span> 
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(appointment.status || '')}`}>
                   {appointment.status}
                </span>
            </div>
         </div>
      </div>

      {/* Layout principal com Edição e Histórico */} 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"> 
            {/* Coluna Principal: Edição de Nota */}            
            <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-4 sm:p-6 space-y-4"> 
                 <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {correctingNoteId ? 'Corrigindo Anotação Clínica' : 'Anotação Clínica do Atendimento'}
                 </h2>
                 {correctingNoteId && (
                    <div className="text-sm text-orange-800 bg-orange-100 p-3 rounded-md border border-orange-200">
                        Você está corrigindo uma nota anterior. A original será mantida no histórico.
                    </div>
                 )}
                 
                 {/* Campo de Texto Principal */} 
                 <div>
                    <label htmlFor="clinicalNote" className="sr-only">Anotação Clínica</label>
                    <textarea 
                        id="clinicalNote"
                        rows={correctingNoteId ? 6 : 12} // Ajustado para melhor responsividade
                        placeholder="Digite as anotações aqui..."
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                    ></textarea>
                 </div>

                 {/* Campo Motivo da Correção (condicional) */} 
                 {correctingNoteId && (
                    <div>
                        <label htmlFor="correctionReason" className="block text-sm font-medium text-gray-700 mb-1">Motivo da Correção <span className="text-red-500">*</span></label>
                        <input 
                           type="text"
                           id="correctionReason"
                           value={correctionReasonText}
                           onChange={(e) => setCorrectionReasonText(e.target.value)}
                           placeholder="Ex: Erro de digitação, informação incompleta"
                           className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                           required 
                        />
                    </div>
                 )}

                 {/* Botões Salvar/Cancelar Correção */}
                 <div className='flex flex-wrap gap-3 items-center'> {/* Gap ajustado */}
                     <button 
                         onClick={handleSaveNoteClick}
                         className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 
                                     ${correctingNoteId 
                                        ? 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'}`}
                     >
                         {correctingNoteId ? 'Salvar Correção' : 'Salvar Nota no Histórico'}
                     </button>
                     {correctingNoteId && (
                         <button 
                             onClick={() => { 
                                 setCorrectingNoteId(null); 
                                 setCurrentNoteText(''); 
                                 setCorrectionReasonText(''); 
                                 try {
                                      const draft = localStorage.getItem(draftNoteKey);
                                      if(draft) setCurrentNoteText(draft);
                                 } catch {}
                              }} 
                             className="inline-flex items-center justify-center px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 shadow-sm"
                         >
                             Cancelar Correção
                         </button>
                     )} 
                 </div>
            </div>

            {/* Coluna Lateral: Histórico Anterior - Estilo Melhorado */} 
            <div className="bg-white shadow-md rounded-lg overflow-hidden"> 
                 <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Histórico Anterior</h3>
                 </div>
                 <div className="px-4 py-5 sm:p-6"> 
                     {historicalNotes.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center min-h-[100px] flex flex-col items-center justify-center bg-gray-50">
                            <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400 mb-3" />
                            <p className="text-gray-500 italic text-center text-sm">Nenhuma nota anterior encontrada.</p>
                        </div>
                     ) : (
                        <ul className="space-y-6 max-h-[60vh] overflow-y-auto pr-2"> 
                        {historicalNotes.map(note => (
                            <li 
                               key={note.id} 
                               className={`
                                  ${note.isCorrectionOf ? 'border-l-4 border-orange-300 pl-4 py-4 bg-orange-50/50 rounded-r-md' : 'py-4'} 
                                  relative transition-colors duration-150 ease-in-out 
                                  group
                               `}
                            >
                                {/* Botão Corrigir - Estilo Melhorado */} 
                                {!note.isCorrectionOf && (
                                    <button 
                                        onClick={() => handleStartCorrection(note)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 rounded-full hover:bg-orange-100 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                        title="Corrigir esta nota"
                                    >
                                        <PencilSquareIcon className="h-4 w-4"/>
                                    </button>
                                )}
                                
                                {/* Cabeçalho da Nota/Correção */} 
                                <div className="mb-2 text-xs space-y-0.5 pr-8"> {/* pr-8 para não sobrepor botão */} 
                                   {note.isCorrectionOf && (
                                       <p className="font-semibold text-orange-800">
                                          [CORREÇÃO da nota {note.isCorrectionOf.substring(0, 8)}...]
                                       </p>
                                   )}
                                   {note.correctionReason && (
                                      <p className="italic text-gray-600">
                                         Motivo: {note.correctionReason}
                                      </p>
                                   )}
                                   {note.appointmentDate && (
                                     <p className="text-gray-500">
                                       Ref. Atendimento: {format(new Date(note.appointmentDate), 'dd/MM/yyyy HH:mm')}
                                     </p>
                                   )}
                                   <p className="font-medium text-gray-600">
                                     {note.isCorrectionOf ? 'Correção salva em:' : 'Salvo em:'} {format(new Date(note.date), 'dd/MM/yyyy HH:mm')} 
                                     <span className="font-normal text-gray-500 ml-1">(Dr. {note.doctorId})</span>
                                   </p>
                                </div>
                                
                                {/* Texto da Nota/Correção */} 
                                <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                                    {note.text}
                                </p>
                                
                                {/* Linha divisória */} 
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 group-last:hidden 
                                   ${note.isCorrectionOf ? 'ml-4' : ''}"></div> 
                            </li>
                        ))}
                        </ul>
                     )}
                 </div>
            </div>
       </div>

      {/* Botões de Ação Inferiores - Estilo Melhorado */} 
      <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
         <button 
            onClick={() => router.back()} 
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
         >
             <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> 
             Voltar ao Painel
         </button>
         <button 
            onClick={handleFinalizarAtendimento}
            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
         >
            <CheckCircleIcon className="h-4 w-4 mr-1.5" />
            Finalizar Atendimento
         </button>
      </div>

    </div>
  );
} 