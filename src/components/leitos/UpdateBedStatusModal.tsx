'use client';

import { useState, useCallback, useEffect } from 'react';
// Remover importações de @/types
// import type { Bed } from '@/types';
// import { BedStatus } from '@/types';
import { useBedManagement, Bed, Room, BedStatus } from '@/context/BedManagementContext';
import { usePatients, Patient } from '@/context/PatientsContext';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface UpdateBedStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed | null;
}

// Função auxiliar para obter as classes CSS da Tag/Botão com base no status
const getStatusStyles = (status: BedStatus): { tagClasses: string; buttonClasses: string; label: string } => {
  switch (status) {
    case BedStatus.LIVRE:
      return {
        tagClasses: 'bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium',
        buttonClasses: 'bg-green-500 hover:bg-green-600 text-white',
        label: BedStatus.LIVRE
      };
    case BedStatus.OCUPADO:
      return {
        tagClasses: 'bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium',
        buttonClasses: 'bg-red-500 hover:bg-red-600 text-white',
        label: BedStatus.OCUPADO
      };
    case BedStatus.HIGIENIZANDO:
      return {
        tagClasses: 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium',
        buttonClasses: 'bg-blue-500 hover:bg-blue-600 text-white',
        label: BedStatus.HIGIENIZANDO
      };
    case BedStatus.DESATIVADO:
      return {
        tagClasses: 'bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-medium',
        buttonClasses: 'bg-gray-500 hover:bg-gray-600 text-white',
        label: BedStatus.DESATIVADO
      };
    default:
      return {
        tagClasses: 'bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-medium',
        buttonClasses: 'bg-gray-400 text-gray-800 cursor-not-allowed', // Estilo padrão/fallback
        label: 'Desconhecido'
      };
  }
};

// Função auxiliar para determinar os próximos status válidos
const getNextValidStatuses = (currentStatus: BedStatus): BedStatus[] => {
  switch (currentStatus) {
    case BedStatus.LIVRE:
      return [BedStatus.OCUPADO, BedStatus.DESATIVADO];
    case BedStatus.OCUPADO:
      return [BedStatus.HIGIENIZANDO];
    case BedStatus.HIGIENIZANDO:
      return [BedStatus.LIVRE, BedStatus.DESATIVADO];
    case BedStatus.DESATIVADO:
      return [BedStatus.LIVRE];
    default:
      return [];
  }
};

export const UpdateBedStatusModal: React.FC<UpdateBedStatusModalProps> = ({ isOpen, onClose, bed }) => {
  // Contextos
  const { updateBed } = useBedManagement();
  const { patients } = usePatients(); // Obter lista de pacientes
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Novo estado: controla se estamos na etapa de selecionar paciente
  const [selectingPatient, setSelectingPatient] = useState(false);
  // Novo estado: guarda o ID do paciente selecionado
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Resetar estados ao fechar/reabrir
  useEffect(() => {
    if (isOpen) {
        setSelectingPatient(false);
        setSelectedPatientId('');
        setError(null);
        setIsLoading(false);
    }
  }, [isOpen]);

  // Lógica para lidar com a atualização de status / início da admissão
  const handleStatusChangeClick = useCallback(async (newStatus: BedStatus) => {
    if (!bed) return;

    if (newStatus === BedStatus.OCUPADO) {
      // Se vai ocupar, entra no modo de seleção de paciente
      setSelectingPatient(true);
      // Não faz a chamada API ainda
    } else {
      // Para outros status (Higienizando, Livre, Desativado), atualiza direto
      setIsLoading(true);
      setError(null);
      try {
        await updateBed(bed.id, { status: newStatus });
        onClose(); // Fecha o modal
      } catch (err) {
        console.error("Error updating bed status:", err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status.');
        setIsLoading(false);
      } 
      // finally não é necessário aqui pois setLoading só ocorre no sucesso ou erro
    }
  }, [bed, updateBed, onClose]);

  // Lógica para confirmar a internação após selecionar paciente
  const handleConfirmAdmission = useCallback(async () => {
    if (!bed || !selectedPatientId) {
        toast.error("Por favor, selecione um paciente.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Chama updateBed passando status, patientId e data de admissão
      await updateBed(bed.id, { 
        status: BedStatus.OCUPADO, 
        patientId: selectedPatientId,
        admissionDate: new Date(), // Adiciona data/hora atual
      });
      onClose(); // Fecha o modal
    } catch (err) {
      console.error("Error admitting patient:", err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao confirmar internação.');
    } finally {
      setIsLoading(false);
    }
  }, [bed, selectedPatientId, updateBed, onClose]);

  if (!isOpen || !bed) return null; 

  const currentStatus = bed.status;
  const nextStatuses = getNextValidStatuses(currentStatus);
  const currentStatusStyles = getStatusStyles(currentStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {/* Mudar título se estiver selecionando paciente */} 
            {selectingPatient ? `Internar Paciente no Leito ${bed.number}` : `Alterar Status do Leito ${bed.number}`}
          </h2>
          <button
            onClick={onClose} // Sempre fecha o modal
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */} 
        <div className="p-4 space-y-4">
          {/* Mostra status atual apenas se NÃO estiver selecionando paciente */} 
          {!selectingPatient && (
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700">Status Atual:</span>
              <span className={currentStatusStyles.tagClasses}>
                {currentStatusStyles.label}
              </span>
            </div>
          )}

          {/* Lógica Condicional: Mostrar botões de status OU seleção de paciente */} 
          {!selectingPatient ? (
            // 1. Mostrar botões para mudar status
            <div className="space-y-2">
              <p className="font-semibold text-gray-700">Selecione o Novo Status:</p>
              <div className="grid grid-cols-1 gap-2">
                {nextStatuses.map((status) => {
                  const statusStyles = getStatusStyles(status);
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChangeClick(status)}
                      disabled={isLoading}
                      className={`w-full text-center font-medium py-2 px-4 rounded transition duration-150 ease-in-out ${statusStyles.buttonClasses} disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {/* Mostrar loading apenas no botão clicado? (complexo) Ou geral? */}
                      {isLoading ? 'Alterando...' : statusStyles.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // 2. Mostrar seleção de paciente
            <div className="space-y-2">
              <label htmlFor="patientSelect" className="block text-sm font-medium text-gray-700">Selecione o Paciente <span className="text-red-500">*</span></label>
              <select
                id="patientSelect"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="" disabled>-- Selecione --</option>
                {patients.sort((a,b) => a.name.localeCompare(b.name)).map((patient: Patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} {patient.cpf ? `(${patient.cpf})` : ''}
                  </option>
                ))}
              </select>
              {/* Botão Confirmar Internação */} 
              <button
                onClick={handleConfirmAdmission}
                disabled={isLoading || !selectedPatientId}
                className="w-full mt-4 text-center font-medium py-2 px-4 rounded transition duration-150 ease-in-out bg-red-500 hover:bg-red-600 text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isLoading ? 'Internando...' : 'Confirmar Internação'}
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2">
              Erro: {error}
            </p>
          )}
        </div>

        {/* Footer (Botão Cancelar genérico) */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            // Se estiver selecionando paciente, o cancelar volta para a seleção de status?
            // Ou sempre fecha? Por simplicidade, vamos sempre fechar.
            onClick={onClose} 
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}; 