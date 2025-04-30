import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Doctor, Patient, Appointment, HealthPlan } from '@/types/index';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import { useHealthPlans } from '@/context/HealthPlansContext';
import { useAppointments } from '@/context/AppointmentsContext';
import toast from 'react-hot-toast';

// Registrar locale pt-BR (pode ser removido se DatePicker não for mais usado aqui)
// registerLocale('pt-BR', ptBR);

// Simplificar AddedSlot: apenas médico
export interface AddedDoctorSequenceItem { // Renomear para clareza
  slotId: string; // ID temporário para a lista
  doctorId: string;
  doctorName: string;
}

interface MultiAppointmentFormProps {
  // onMultiSave não é mais necessário, vamos salvar direto via contexto
  onClose: () => void;
}

// --- Interface AJUSTADA --- 
// (Não precisa exportar se usada apenas aqui)
interface ApiSuggestion { 
  date?: string; 
  newAppointments?: {
    doctorId: string;
    start: string | null; // Permitir null se data inválida
    end: string | null;   // Permitir null se data inválida
  }[]; 
  optionId?: number; 
  explanation?: string;
  recommended?: boolean;
  rescheduledAppointments?: { 
      originalAppointmentId: string;
      originalPatientId: string;
      originalDoctorId: string;
      newSuggestedStart: string;
      newSuggestedEnd: string;
  }[];
  [key: string]: any; 
}
// --------------------------

// Definir tipos específicos para os itens dos arrays
type NewAppointmentDetail = {
  doctorId: string;
  start: string | null;
  end: string | null;
};

type RescheduledItem = {
  originalAppointmentId?: string;
  originalPatientId?: string;
  originalDoctorId?: string;
  newSuggestedStart?: string;
};

// --- Definir o fuso horário da clínica --- 
const CLINIC_TIME_ZONE = 'America/Sao_Paulo'; // <-- Ajuste se necessário
// -----------------------------------------

// Remover onMultiSave das props
const MultiAppointmentForm: React.FC<MultiAppointmentFormProps> = ({ onClose }) => {
  const doctors: Doctor[] = doctorsData;
  const patients: Patient[] = patientsData;
  const { healthPlans, isLoading: isLoadingPlans } = useHealthPlans();
  const { appointments, addAppointment, updateAppointment } = useAppointments();

  // Estado do formulário
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [value, setValue] = useState<string>('');
  const [healthPlanId, setHealthPlanId] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [addedDoctors, setAddedDoctors] = useState<AddedDoctorSequenceItem[]>([]); // Renomear estado
  const [priority, setPriority] = useState<'Mínima' | 'Média' | 'Máxima'>('Média'); 

  // --- Estados usando ApiSuggestion ---
  const [suggestions, setSuggestions] = useState<ApiSuggestion[] | null>(null);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ApiSuggestion | null>(null); 

  // Opções formatadas para react-select (mantidas)
  const patientOptions = useMemo(() => 
    patients.map(p => ({ value: p.id, label: p.name }))
  , [patients]);

  const doctorOptions = useMemo(() => 
    doctors.map(d => ({ value: d.id, label: d.name }))
  , [doctors]);

  const healthPlanOptions = useMemo(() => [
    { value: '', label: 'Particular / Nenhum' }, 
    ...healthPlans.map(plan => ({ value: plan.id, label: plan.name }))
  ], [healthPlans]);

  // Função para ADICIONAR MÉDICO à sequência
  const handleAddDoctorToSequence = () => {
    if (!currentDoctorId) {
      toast.error("Selecione um médico.");
      return;
    }
    const doctor = doctors.find(d => d.id === currentDoctorId);
    if (!doctor) {
        toast.error("Médico selecionado inválido.");
        return;
    }

    // Não precisamos mais validar conflito de horário aqui

    const newDoctorItem: AddedDoctorSequenceItem = {
      slotId: `doc-${Date.now()}-${Math.random()}`,
      doctorId: currentDoctorId,
      doctorName: doctor.name,
    };

    setAddedDoctors(prev => [...prev, newDoctorItem]);
    setCurrentDoctorId(null); // Limpa o seletor de médico após adicionar
  };

  // Função para remover um MÉDICO da sequência
  const handleRemoveDoctorFromSequence = (slotIdToRemove: string) => {
    setAddedDoctors(prev => prev.filter(doc => doc.slotId !== slotIdToRemove));
    setSelectedSuggestion(null); // Reseta sugestão selecionada se a sequência mudar
  };

  // Função para chamar a API de sugestão
  const handleSuggestSlots = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente primeiro.");
      return;
    }
    if (addedDoctors.length === 0) { 
        toast.error("Adicione os médicos desejados na ordem correta antes de pedir sugestões.");
        return;
    }

    setIsSuggesting(true);
    setSuggestions(null); 
    setSelectedSuggestion(null); 
    const suggestionToastId = toast.loading("Buscando sugestões...");

    // --- Calcular janela de tempo AQUI para filtrar contexto --- 
    const today = new Date();
    const fourDaysLater = new Date();
    fourDaysLater.setDate(today.getDate() + 4); // +4 para incluir o final do 4º dia
    // -----------------------------------------------------------

    // --- Filtro de Contexto MAIS AMPLO (por data) ---
    const relevantAppointmentsFromContext = appointments.filter(app => {
        try {
            const appStartDate = new Date(app.start);
            // Incluir agendamentos que começam HOJE ou nos próximos 3 dias
            return appStartDate >= today && appStartDate < fourDaysLater;
        } catch (e) {
            console.warn("Erro ao parsear data do agendamento para filtro de contexto:", app.start, e);
            return false; // Ignora agendamentos com data inválida
        }
    });
    // -----------------------------------------------

    const requestBody = {
        patientId: selectedPatientId,
        doctorSequence: addedDoctors.map(doc => doc.doctorId),
        priority: priority,
        // Enviar a lista filtrada pela janela de tempo
        relevantAppointments: relevantAppointmentsFromContext 
    };

    console.log("Enviando para API de sugestão com contexto AMPLIADO:", requestBody);
    console.log(`${relevantAppointmentsFromContext.length} agendamentos relevantes na janela de tempo enviados.`);

    try {
        const response = await fetch('/api/suggest-slots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erro ${response.status} ao buscar sugestões.`);
        }
        console.log("API retornou sugestões:", data.suggestions);

        // --- MAPEAMENTO DA RESPOSTA --- 
        let rawSuggestions: any[] = [];
        if (data && Array.isArray(data.suggestions)) { // Backend agora retorna data.suggestions
            rawSuggestions = data.suggestions;
        } else { console.warn("Backend não retornou data.suggestions:", data); }
        console.log("Sugestões brutas recebidas do backend:", rawSuggestions);

        const mappedSuggestions: ApiSuggestion[] = rawSuggestions.map((rawSug, index) => {
            let appointmentDetailsArray: any[] = [];
            // Flexibilidade para encontrar o array interno
            if (Array.isArray(rawSug.schedule)) { appointmentDetailsArray = rawSug.schedule; }
            else if (Array.isArray(rawSug.appointments)) { appointmentDetailsArray = rawSug.appointments; }
            else if (Array.isArray(rawSug.newAppointments)) { appointmentDetailsArray = rawSug.newAppointments; }
            // Adicione mais chaves se a API usar outras
            
            // Mapeia os detalhes internos para nossa estrutura start/end
            const mappedNewAppointments = appointmentDetailsArray.map(appDetail => {
                let startStr: string | null = appDetail.start; // Assume que já pode ser ISO
                let endStr: string | null = appDetail.end;
                
                // Se tiver date e startTime/endTime, constrói string local (SEM O 'Z')
                if (rawSug.date && appDetail.startTime) {
                    // Remover o :00Z ou Z no final se houver
                    const cleanStartTime = appDetail.startTime.replace(/(:00)?Z$/, '');
                    // Adicionar :00 se for hora cheia (ex: "08" -> "08:00")
                    const formattedStartTime = cleanStartTime.includes(':') ? cleanStartTime : `${cleanStartTime}:00`;
                    startStr = `${rawSug.date}T${formattedStartTime}`; // Sem Z!
                }
                if (rawSug.date && appDetail.endTime) {
                    const cleanEndTime = appDetail.endTime.replace(/(:00)?Z$/, '');
                    const formattedEndTime = cleanEndTime.includes(':') ? cleanEndTime : `${cleanEndTime}:00`;
                    endStr = `${rawSug.date}T${formattedEndTime}`; // Sem Z!
                }
                // Tenta parsear para garantir que é uma data válida, senão null
                try { if(startStr) parseISO(startStr); else startStr = null; } catch { startStr = null; }
                try { if(endStr) parseISO(endStr); else endStr = null; } catch { endStr = null; }

                return {
                    doctorId: appDetail.doctorId,
                    start: startStr, 
                    end: endStr,
                };
            }).filter(app => app.start && app.end); // Filtra agendamentos com datas inválidas

            return {
                ...rawSug, // Mantém outros campos como date, explanation (se vierem)
                optionId: rawSug.optionId ?? (index + 1), 
                newAppointments: mappedNewAppointments 
            };
        }).filter(sug => sug.newAppointments && sug.newAppointments.length > 0); // Filtra sugestões sem agendamentos válidos
        // --- FIM DO MAPEAMENTO ---

        console.log("Sugestões mapeadas para o frontend:", mappedSuggestions);
        setSuggestions(mappedSuggestions);

        if (mappedSuggestions.length > 0) {
            toast.success("Sugestões carregadas! Escolha uma opção abaixo.", { id: suggestionToastId });
        } else {
            toast.error("Nenhuma sugestão válida encontrada pela IA ou formato de resposta inesperado.", { id: suggestionToastId });
        }
    } catch (error) {
        console.error("Erro ao chamar API de sugestão:", error);
        const message = error instanceof Error ? error.message : "Falha ao buscar sugestões da IA.";
        toast.error(message, { id: suggestionToastId });
        setSuggestions(null);
    } finally {
        setIsSuggesting(false); 
    }
  };

  // Função para lidar com a seleção de uma sugestão
  const handleSelectSuggestion = (selectedOption: ApiSuggestion) => {
    console.log("Sugestão selecionada:", selectedOption);
    setSelectedSuggestion(selectedOption); 
    setSuggestions(null); 
    toast.success(`Opção ${selectedOption.optionId} selecionada. Clique em 'Salvar Agendamentos' para confirmar.`);
  };

  // Função para SUBMETER a SUGESTÃO SELECIONADA
  const handleSubmit = async () => {
    if (!selectedSuggestion || !Array.isArray(selectedSuggestion.newAppointments) || selectedSuggestion.newAppointments.length === 0) { 
      toast.error("Nenhuma sugestão válida da IA foi selecionada ou ela não contém agendamentos.");
      return;
    }
    if (!selectedPatientId) { toast.error("Paciente não selecionado."); return; }

    const { newAppointments } = selectedSuggestion; 
    // Remanejamentos (usar fallback se não vier da API mapeada)
    const rescheduledAppointments = selectedSuggestion.rescheduledAppointments || [];
    
    const toastId = toast.loading("Salvando agendamentos...");
    let success = true;
    try {
        // 1. Criar novos agendamentos (lógica interna mantida, pois usa start/end)
        for (const appData of newAppointments) {
            // Adicionar checagem extra para start/end válidos antes de criar
            if (!appData.start || !appData.end) {
                console.warn("Agendamento inválido pulado (start/end ausente):", appData);
                continue;
            }
            const newAppointmentObject: Appointment = {
                id: `app-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                title: `${patients.find(p=>p.id === selectedPatientId)?.name || 'Paciente'} / ${doctors.find(d=>d.id === appData.doctorId)?.name || 'Médico'}`,
                start: appData.start, // Já está no formato ISO correto
                end: appData.end,     // Já está no formato ISO correto
                doctorId: appData.doctorId,
                patientId: selectedPatientId,
                priority: priority, 
                value: parseFloat(value.replace(/\./g, '').replace(',', '.')) || undefined,
                healthPlanId: healthPlanId || undefined,
                status: 'Scheduled',
            };
            addAppointment(newAppointmentObject);
        }

        // 2. Atualizar remanejamentos (lógica interna mantida)
        if (rescheduledAppointments.length > 0) {
            for (const reschedData of rescheduledAppointments) {
                updateAppointment(reschedData.originalAppointmentId, {
                    start: reschedData.newSuggestedStart,
                    end: reschedData.newSuggestedEnd,
                    status: 'Scheduled',
                });
            }
        }
        toast.success("Agendamentos salvos com sucesso!", { id: toastId });
        onClose(); 
    } catch (error) {
        console.error("Erro ao salvar agendamentos da sugestão:", error);
        toast.error("Erro ao salvar um ou mais agendamentos.", { id: toastId });
        success = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-3">Agendamento Sequencial Inteligente</h2>
        
        {/* Campos Paciente, Plano, Valor, Prioridade - Mantidos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
             {/* Seletor Paciente */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1. Paciente *</label>
            <Select
              options={patientOptions}
              onChange={(option) => setSelectedPatientId(option?.value || null)}
                placeholder="Selecione..."
              isClearable
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              menuPortalTarget={document.body}
            />
          </div>
            {/* Seletor Plano */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">2. Plano</label>
            <Select
              options={healthPlanOptions}
              value={healthPlanOptions.find(opt => opt.value === (healthPlanId ?? ''))}
              onChange={(option) => setHealthPlanId(option?.value || null)}
              placeholder="Selecione..."
              isDisabled={isLoadingPlans}
              isLoading={isLoadingPlans}
              isClearable={false}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              menuPortalTarget={document.body}
            />
          </div>
            {/* Input Valor */}
          <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">3. Valor (R$)</label>
              <input
                type="text"
                id="value"
                value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^0-9,]/g, ''))} 
                placeholder="0,00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
          </div>
            {/* Seletor Prioridade */}
            <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">4. Prioridade *</label>
                <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Mínima' | 'Média' | 'Máxima')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                >
                <option value="Mínima">Mínima</option>
                <option value="Média">Média</option>
                <option value="Máxima">Máxima</option>
                </select>
          </div>
        </div>

        {/* Seção para Adicionar Médicos à Sequência */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-base font-semibold text-gray-700 mb-3">5. Adicionar Médicos à Sequência (em ordem)</h3>
          <div className="flex items-end gap-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">Médico *</label>
              <Select
                options={doctorOptions}
                 value={doctorOptions.find(opt => opt.value === currentDoctorId) || null} // Permite limpar seleção
                onChange={(option) => setCurrentDoctorId(option?.value || null)}
                 placeholder="Selecione o próximo médico..."
                 isClearable
                 styles={{ menuPortal: base => ({ ...base, zIndex: 9998 }) }}
                menuPortalTarget={document.body}
              />
            </div>
              <button 
              onClick={handleAddDoctorToSequence}
              disabled={!currentDoctorId} // Desabilitar se nenhum médico selecionado
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              + Adicionar Médico
              </button>
            </div>
                  </div>

        {/* Lista de Médicos na Sequência */} 
        <div className="flex-grow overflow-y-auto mt-4 border-t pt-4 min-h-[100px]"> {/* Adiciona min-height */}
             <h3 className="text-base font-semibold text-gray-700 mb-2">Sequência Desejada ({addedDoctors.length})</h3>
             {addedDoctors.length > 0 ? (
                <ul className="space-y-2">
                {addedDoctors.map((docItem, index) => (
                    <li key={docItem.slotId} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span>{index + 1}. Dr(a). {docItem.doctorName}</span>
                    <button onClick={() => handleRemoveDoctorFromSequence(docItem.slotId)} className="text-red-500 hover:text-red-700 text-sm">Remover</button>
                </li>
              ))}
            </ul>
            ) : (
                <p className="text-sm text-gray-500 italic">Adicione os médicos na ordem desejada para o atendimento.</p>
            )}
            
            {/* Exibição das Sugestões da IA */} 
            {isSuggesting && ( <div className="mt-4 text-center text-gray-600">Buscando...</div> )}
            
            {suggestions && suggestions.length > 0 && (
                <div className="mt-4 border-t pt-4 space-y-4">
                    <h3 className="text-base font-semibold text-indigo-700">Sugestões da IA (Escolha uma):</h3>
                    {suggestions.map((suggestion: ApiSuggestion | null, outerIndex: number) => {
                        if (!suggestion) { return null; }

                        const hasNewAppointments = Array.isArray(suggestion.newAppointments) && suggestion.newAppointments.length > 0;
                        const hasRescheduledAppointments = Array.isArray(suggestion.rescheduledAppointments) && suggestion.rescheduledAppointments.length > 0;
                        
                        const suggestionKey = suggestion.optionId ?? `suggestion-fallback-${outerIndex}`;
                        let displayDate = 'Data não informada';
                        // Garantir que suggestion.date existe e é string
                        if (suggestion && suggestion.date && typeof suggestion.date === 'string') {
                            try { 
                                // Adicionar T00:00:00 (local) para ajudar parseISO
                                displayDate = format(parseISO(`${suggestion.date}T00:00:00`), 'dd/MM/yyyy'); 
                            } catch (e) { 
                                // Logar erro se a formatação falhar mesmo com a data presente
                                console.warn(`Erro ao formatar data da sugestão ${suggestionKey}: ${suggestion.date}`, e);
                                displayDate = 'Erro Data'; // Indicar erro na formatação
                            }
                        } else if (suggestion) {
                             // Logar se a data estiver faltando ou for inválida na sugestão recebida
                             console.warn(`Data faltando ou inválida para sugestão ${suggestionKey}:`, suggestion.date);
                        }

                        return (
                            <div key={suggestionKey} className={`border rounded-md p-4 ${suggestion.recommended ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'}`}>
                               <p className="text-sm mb-2">
                                   <strong className={suggestion.recommended ? 'text-green-700' : ''}>
                                       Opção {suggestion.optionId}{suggestion.recommended ? ' (Recomendada)' : ''}: 
                                   </strong> 
                                   {suggestion.explanation || `Horários em ${displayDate}`}
                               </p>
                               
                               {hasNewAppointments && (
                                   <div className="mb-2">
                                       <p className="text-xs font-medium text-gray-600 mb-1">Agendamentos Propostos:</p>
                                       <ul className="list-disc list-inside space-y-1 pl-2">
                                           {(suggestion.newAppointments || []).map((app: NewAppointmentDetail, index: number) => {
                                                if (!app || !app.start || !app.end) return null; // Checagem extra
                                                
                                                // --- Formatar usando formatInTimeZone --- 
                                                let startTimeFormatted = 'Inválido';
                                                let endTimeFormatted = 'Inválido';
                                                try {
                                                    // Passa a string local, o fuso, e o formato desejado
                                                    startTimeFormatted = formatInTimeZone(app.start, CLINIC_TIME_ZONE, 'HH:mm'); 
                                                } catch (e) { console.error("Erro formatando start:", app.start, e); }
                                                try { 
                                                    endTimeFormatted = formatInTimeZone(app.end, CLINIC_TIME_ZONE, 'HH:mm'); 
                                                } catch (e) { console.error("Erro formatando end:", app.end, e); }
                                                // ----------------------------------------

                                                return (
                                                    <li key={`new-${suggestionKey}-${app.doctorId}-${app.start}-${index}`} className="text-xs text-gray-700">
                                                        Dr(a). {doctors.find(d => d.id === app.doctorId)?.name || app.doctorId} - {startTimeFormatted} até {endTimeFormatted}
                                                    </li>
                                                );
                                            })}
                                       </ul>
                                   </div>
                               )}

                               {hasRescheduledAppointments && (
                                   <div className="mb-3">
                                       <p className="text-xs font-medium text-orange-700 mb-1">Remanejamentos Sugeridos:</p>
                                       <ul className="list-disc list-inside space-y-1 pl-2">
                                           {Array.isArray(suggestion.rescheduledAppointments) && suggestion.rescheduledAppointments.map((resched: RescheduledItem, index: number) => { 
                                               if (!resched) return null; 
                                               const reschedKey = resched.originalAppointmentId ?? `resched-fallback-${suggestionKey}-${index}`;
                                               const patientDisplay = patients.find(p => p.id === resched.originalPatientId)?.name || `ID: ${resched.originalPatientId ?? '?'}`;
                                               const doctorDisplay = doctors.find(d => d.id === resched.originalDoctorId)?.name || `ID: ${resched.originalDoctorId ?? '?'}`;
                                               let newTimeFormatted = 'Inválido';
                                               try { 
                                                   if (resched.newSuggestedStart) { 
                                                       newTimeFormatted = format(parseISO(resched.newSuggestedStart), 'dd/MM/yyyy HH:mm'); 
                                                   }
                                               } catch {}
                                               return (
                                                   <li key={reschedKey} className="text-xs text-orange-800">
                                                       Paciente {patientDisplay} (com Dr(a). {doctorDisplay}) para {newTimeFormatted}
                                                   </li>
                                               );
                                           })}
                                       </ul>
                                   </div>
                               )}

                               <button 
                                 onClick={() => handleSelectSuggestion(suggestion)}
                                 className="mt-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                               >
                                   Selecionar esta opção
                               </button>
                            </div>
                        );
                    })}
                </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button 
            onClick={handleSuggestSlots}
            disabled={isSuggesting || addedDoctors.length === 0 || !selectedPatientId} // Usa addedDoctors
            className="px-5 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Usar IA para encontrar horários sequenciais ideais"
          >
            Sugerir Horários (IA)
          </button>
          <button 
            onClick={handleSubmit}
            // Habilitar SOMENTE se uma sugestão foi selecionada E não estiver buscando sugestão
            disabled={!selectedSuggestion || isSuggesting}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Salvar Agendamentos
          </button>
          <button 
            onClick={onClose} 
            disabled={isSuggesting}
            className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiAppointmentForm; 