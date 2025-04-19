import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { format, setHours, setMinutes, addHours } from 'date-fns';
import { Doctor, Patient, Appointment, HealthPlan } from '@/types/index';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import { useHealthPlans } from '@/context/HealthPlansContext';
import toast from 'react-hot-toast';

import "react-datepicker/dist/react-datepicker.css";

// Registrar locale pt-BR para DatePicker
registerLocale('pt-BR', ptBR);

// Tipagem para os slots adicionados (adicionar value)
export interface AddedSlot {
  slotId: string; // ID temporário
  doctorId: string;
  doctorName: string;
  start: string; // ISO string
  end: string;   // ISO string
}

// Tipagem para os dados enviados ao salvar (Omit<Appointment,...>)
// Usaremos Omit<Appointment, ...> diretamente na função onMultiSave

interface MultiAppointmentFormProps {
  // Ajustar onMultiSave para receber dados mais completos, incluindo value
  onMultiSave: (patientId: string, slots: Array<Omit<Appointment, 'id' | 'title' | 'patientId' | 'status'>>) => void;
  onClose: () => void;
}

const MultiAppointmentForm: React.FC<MultiAppointmentFormProps> = ({ onMultiSave, onClose }) => {
  const doctors: Doctor[] = doctorsData;
  const patients: Patient[] = patientsData;
  const { healthPlans, isLoading: isLoadingPlans } = useHealthPlans();

  // Estado do formulário
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [value, setValue] = useState<string>('');
  const [healthPlanId, setHealthPlanId] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [currentStartDate, setCurrentStartDate] = useState<Date | null>(setHours(setMinutes(new Date(), 0), 9));
  const [currentEndDate, setCurrentEndDate] = useState<Date | null>(addHours(currentStartDate || new Date(), 1));
  const [addedSlots, setAddedSlots] = useState<AddedSlot[]>([]);

  // Atualiza data final quando a inicial muda
  useEffect(() => {
    if (currentStartDate) {
      setCurrentEndDate(addHours(currentStartDate, 1));
    }
  }, [currentStartDate]);

  // Opções formatadas para react-select
  const patientOptions = useMemo(() => 
    patients.map(p => ({ value: p.id, label: p.name }))
  , [patients]);

  const doctorOptions = useMemo(() => 
    doctors.map(d => ({ value: d.id, label: d.name }))
  , [doctors]);

  // --- NOVO: Opções para planos de saúde ---
  const healthPlanOptions = useMemo(() => [
    { value: '', label: 'Particular / Nenhum' }, // Opção Padrão
    ...healthPlans.map(plan => ({ value: plan.id, label: plan.name }))
  ], [healthPlans]);
  // --- FIM: Opções --- 

  // Função para adicionar um slot à lista (COM VALIDAÇÃO)
  const handleAddSlot = () => {
    if (!currentDoctorId || !currentStartDate || !currentEndDate) {
      toast.error("Selecione médico e datas/horas de início e fim válidas.");
      return;
    }
    if (currentEndDate <= currentStartDate) {
        toast.error("A data/hora final deve ser posterior à data/hora inicial.");
        return;
    }

    const doctor = doctors.find(d => d.id === currentDoctorId);
    if (!doctor) {
        toast.error("Médico selecionado inválido.");
        return;
    }

    // --- VALIDAÇÃO DE CONFLITO --- 
    const newSlotStart = currentStartDate;
    const newSlotEnd = currentEndDate;

    for (const existingSlot of addedSlots) {
        const existingStart = new Date(existingSlot.start);
        const existingEnd = new Date(existingSlot.end);

        // Verifica sobreposição: (StartA < EndB) and (EndA > StartB)
        const overlaps = newSlotStart < existingEnd && newSlotEnd > existingStart;

        if (overlaps) {
            // Conflito encontrado
            if (existingSlot.doctorId === currentDoctorId) {
                 toast.error(`Conflito de horário: Dr(a). ${doctor.name} já possui um agendamento neste intervalo na lista.`);
            } else {
                 toast.error(`Conflito de horário: O intervalo selecionado já está ocupado por Dr(a). ${existingSlot.doctorName} na lista.`);
            }
            return; // Impede a adição
        }
    }
    // --- FIM DA VALIDAÇÃO ---

    const newSlot: AddedSlot = {
      slotId: `slot-${Date.now()}-${Math.random()}`,
      doctorId: currentDoctorId,
      doctorName: doctor.name,
      start: currentStartDate.toISOString(),
      end: currentEndDate.toISOString()
    };

    setAddedSlots(prev => [...prev, newSlot]);

    // Resetar campos do slot atual (opcional, pode manter o médico/data)
    // setCurrentDoctorId(null);
    // setCurrentStartDate(setHours(setMinutes(new Date(), 0), 9)); 
  };

  // Função para remover um slot da lista
  const handleRemoveSlot = (slotIdToRemove: string) => {
    setAddedSlots(prev => prev.filter(slot => slot.slotId !== slotIdToRemove));
  };

  // Função para submeter o formulário
  const handleSubmit = () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente.");
      return;
    }
    if (addedSlots.length === 0) {
      toast.error("Adicione pelo menos um horário.");
      return;
    }
    // Validar e converter valor
    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (value && (isNaN(numericValue) || numericValue < 0)) {
        toast.error('Valor financeiro inválido.');
        return;
    }

    // Mapear slots adicionando o valor e healthPlanId
    const slotsToSave = addedSlots.map(({ slotId, doctorName, ...rest }) => ({
      ...rest, 
      value: value ? numericValue : undefined,
      healthPlanId: healthPlanId || undefined,
    }));
    
    onMultiSave(selectedPatientId, slotsToSave);
    onClose(); // Fechar após chamar onMultiSave
  };

  const formatDateForDisplay = (isoString: string) => {
    try {
      return format(new Date(isoString), "dd/MM/yy HH:mm", { locale: ptBR });
    } catch {
      return "Inválido";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-3">Criar Agendamento Múltiplo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Seletor de Paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecione o Paciente *</label>
            <Select
              options={patientOptions}
              onChange={(option) => setSelectedPatientId(option?.value || null)}
              placeholder="Digite ou selecione um paciente..."
              isClearable
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              menuPortalTarget={document.body}
            />
          </div>

          {/* --- NOVO: Seletor Plano de Saúde --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">2. Plano de Saúde</label>
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
          {/* --- FIM: Seletor Plano de Saúde --- */}

          {/* Campo Valor */}
          <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Valor por Atendimento (R$)</label>
              <input
                type="text"
                id="value"
                value={value}
                onChange={(e) => {
                  // Simples máscara para valor monetário PT-BR
                  let v = e.target.value.replace(/\D/g,'');
                  v = (parseInt(v, 10) / 100).toFixed(2) + '';
                  v = v.replace(".", ",");
                  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                  if (v === 'NaN' || v === '0,00') v = '';
                  setValue(v);
                }}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
          </div>
        </div>

        {/* Seção Adicionar Horário */}
        <fieldset className="border p-4 rounded-md mb-4">
          <legend className="text-sm font-medium text-gray-700 px-2">3. Adicionar Horário</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Médico *</label>
              <Select
                options={doctorOptions}
                value={doctorOptions.find(opt => opt.value === currentDoctorId) || null}
                onChange={(option) => setCurrentDoctorId(option?.value || null)}
                placeholder="Selecione..."
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
              <DatePicker
                selected={currentStartDate}
                onChange={(date: Date | null) => setCurrentStartDate(date)}
                locale="pt-BR"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                popperPlacement="top-start"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fim *</label>
              <DatePicker
                selected={currentEndDate}
                onChange={(date: Date | null) => setCurrentEndDate(date)}
                locale="pt-BR"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                popperPlacement="top-start"
              />
            </div>
          </div>
           <div className="text-right">
              <button 
                type="button"
                onClick={handleAddSlot}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                disabled={!currentDoctorId || !currentStartDate || !currentEndDate}
              >
                Adicionar à Lista
              </button>
            </div>
        </fieldset>

        {/* Seção Horários Adicionados */}
        <div className="border p-4 rounded-md mb-4 flex-grow overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-2">4. Horários Adicionados ({addedSlots.length})</h3>
          {addedSlots.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">Nenhum horário adicionado ainda.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {addedSlots.map((slot) => (
                <li key={slot.slotId} className="py-2 px-1 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-gray-800">Dr(a). {slot.doctorName}</span>
                    <span className="ml-2 text-gray-600">
                      ({formatDateForDisplay(slot.start)} - {formatDateForDisplay(slot.end)})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(slot.slotId)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                    title="Remover horário"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Botões Finais */}
        <div className="flex justify-end space-x-3 pt-4 border-t mt-auto">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={!selectedPatientId || addedSlots.length === 0}
          >
            Salvar {addedSlots.length > 1 ? `${addedSlots.length} Agendamentos` : 'Agendamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiAppointmentForm; 