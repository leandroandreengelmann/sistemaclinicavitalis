'use client';

import React, { useState, useEffect } from 'react';
import { Doctor, Patient, AppointmentFormData, Appointment, HealthPlan } from '@/types/index';
import doctorsData from '@/data/doctors.json';
import patientsData from '@/data/patients.json';
import { useHealthPlans } from '@/context/HealthPlansContext';
import { format, parseISO, isValid, isAfter } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';

interface AppointmentFormProps {
  initialData?: Appointment | null;
  selectedDate?: Date | null;
  onSave: (formData: AppointmentFormData, id?: string) => Promise<void>; 
  // Não vamos restaurar o delete por enquanto, focando em create/edit
  // onDelete?: (id: string) => Promise<void>; 
  onClose: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
    initialData, 
    selectedDate, 
    onSave, 
    // onDelete, 
    onClose 
}) => {
  const [patientId, setPatientId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [healthPlanId, setHealthPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); 

  const { healthPlans, isLoading: isLoadingPlans } = useHealthPlans();

  const doctors: Doctor[] = doctorsData;
  const patients: Patient[] = patientsData;

  const isEditing = !!initialData;

  useEffect(() => {
    setError(null); // Limpa erro inicial
    if (isEditing && initialData) {
      setPatientId(initialData.patientId);
      setDoctorId(initialData.doctorId);
      const start = parseISO(initialData.start);
      const end = parseISO(initialData.end);
      if (isValid(start)) {
         setStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
      }
      if (isValid(end)) {
         setEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
      }
      setValue(initialData.value ? initialData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ',') : '');
      setHealthPlanId(initialData.healthPlanId || null);
    } else if (selectedDate) {
      const formattedStartDate = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
      setStartDate(formattedStartDate);
      const suggestedEndDate = new Date(selectedDate.getTime() + 30 * 60000);
      const formattedEndDate = format(suggestedEndDate, "yyyy-MM-dd'T'HH:mm");
      setEndDate(formattedEndDate);
      // Limpar campos restantes ao criar novo
      setPatientId('');
      setDoctorId('');
      setValue('');
      setHealthPlanId(null);
    }
  }, [initialData, selectedDate, isEditing]);

  const validateDates = (): boolean => {
     // ... (função validateDates como definida anteriormente) ...
     try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        if (!isValid(start) || !isValid(end)) {
          setError('Datas inválidas.');
          return false;
        }
        if (!isAfter(end, start)) {
          setError('A data/hora final deve ser após a data/hora inicial.');
          return false;
        }
        setError(null); 
        return true;
      } catch (e) {
        setError('Formato de data inválido.');
        return false;
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (value && (isNaN(numericValue) || numericValue < 0)) {
        setError('Valor financeiro inválido.');
        return;
    }

    if (!patientId || !doctorId || !startDate || !endDate) {
      setError('Por favor, preencha Paciente, Médico, Início e Fim.');
      return;
    }
    if (!validateDates()) {
      return;
    }
    setIsSaving(true);
    const formData: AppointmentFormData = {
      patientId,
      doctorId,
      start: parseISO(startDate).toISOString(),
      end: parseISO(endDate).toISOString(),
      value: value ? numericValue : undefined,
      healthPlanId: healthPlanId || undefined,
    };
    try {
        await onSave(formData, initialData?.id);
        onClose(); // Fechar apenas se salvar com sucesso
    } catch (err) {
        console.error("Erro ao salvar:", err);
        setError('Ocorreu um erro ao salvar. Tente novamente.');
    } finally {
        setIsSaving(false);
    }
  };

  // const handleDelete = async () => { ... } // Removido por enquanto

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} 
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 opacity-100 animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-600 pb-2">
             <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
             <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
        </div>
        {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded">
                {error}
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paciente Select */}
            <div>
                <label htmlFor="patient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente</label>
                <select 
                    id="patient" 
                    value={patientId} 
                    onChange={(e) => setPatientId(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                >
                    <option value="" disabled>Selecione um paciente</option>
                    {patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
            </div>
            {/* Médico Select */}
            <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Médico</label>
                <select 
                    id="doctor" 
                    value={doctorId} 
                    onChange={(e) => setDoctorId(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                >
                    <option value="" disabled>Selecione um médico</option>
                    {doctors.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
            </div>
            {/* Plano de Saúde Select */}
            <div>
              <label htmlFor="healthPlan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano de Saúde</label>
              <select 
                id="healthPlan" 
                value={healthPlanId ?? ''}
                onChange={(e) => setHealthPlanId(e.target.value || null)}
                disabled={isLoadingPlans}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              >
                <option value="">Particular / Nenhum</option>
                {isLoadingPlans ? (
                  <option disabled>Carregando planos...</option>
                ) : (
                  healthPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))
                )}
              </select>
            </div>
            {/* Datas Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                    <input type="datetime-local" id="start-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); validateDates(); }} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"/>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim</label>
                    <input type="datetime-local" id="end-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); validateDates(); }} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"/>
                </div>
            </div>
            {/* Campo Valor (NOVO) */}
            <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                <input
                    type="text"
                    id="value"
                    value={value}
                    onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^\d,.]/g, '');
                        const parts = rawValue.split(',');
                        parts[0] = parts[0].replace(/\./g, '');
                        if (parts[0].length > 3) {
                           parts[0] = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                        }
                        setValue(parts.join(','));
                    }}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
            </div>
            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-600">
                 {/* Botão Excluir removido por enquanto */}
                 <button 
                    type="button" 
                    onClick={onClose} 
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                 >
                    Cancelar
                 </button>
                 <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
                 >
                    {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Agendamento')}
                 </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm; 