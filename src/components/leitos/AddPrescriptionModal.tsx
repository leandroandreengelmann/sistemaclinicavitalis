'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Prescription, PrescriptionItem, Bed } from '@/context/BedManagementContext';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Tipo para os dados do item DENTRO do formulário (sem ID ainda)
type DraftPrescriptionItem = Omit<PrescriptionItem, 'id'>;

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prescriptionData: Omit<Prescription, 'id'>) => Promise<void>;
  bedId: string | null; // ID do leito para associar a prescrição
}

const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({ isOpen, onClose, onSave, bedId }) => {
  const [items, setItems] = useState<DraftPrescriptionItem[]>([]);
  const [prescriberName, setPrescriberName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpa o formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      setItems([{ medicationName: '', dosage: '', route: '', frequency: '', duration: '', notes: '' }]); // Começa com um item vazio
      setPrescriberName('');
      setGeneralNotes('');
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);

  // Adiciona um novo item vazio
  const handleAddItem = () => {
    setItems([...items, { medicationName: '', dosage: '', route: '', frequency: '', duration: '', notes: '' }]);
  };

  // Remove um item pelo índice
  const handleRemoveItem = (index: number) => {
    // Não permite remover o último item
    if (items.length <= 1) {
       toast.error("A prescrição deve ter pelo menos um medicamento.");
       return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Atualiza um campo específico de um item
  const handleItemChange = (index: number, field: keyof DraftPrescriptionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Submete o formulário
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedId) {
      setError("Erro: ID do leito não fornecido.");
      return;
    }

    // Validar se todos os itens têm pelo menos os campos obrigatórios preenchidos
    const validItems = items.filter(item => 
        item.medicationName.trim() !== '' && 
        item.dosage.trim() !== '' && 
        item.route.trim() !== '' && 
        item.frequency.trim() !== ''
    );
    
    if (validItems.length === 0) {
      setError("Adicione pelo menos um medicamento com Nome, Dose, Via e Frequência preenchidos.");
      toast.error("Adicione pelo menos um medicamento válido.");
      return;
    }
     // Verifica se todos os itens adicionados são válidos (ou seja, se algum foi deixado em branco)
     if (validItems.length < items.length) {
         setError("Preencha os campos obrigatórios (Nome, Dose, Via, Frequência) de todos os medicamentos ou remova os itens inválidos.");
         toast.error("Preencha os campos obrigatórios de todos os medicamentos ou remova os itens em branco.");
         return;
     }

    setIsLoading(true);
    setError(null);

    // Tipagem explícita para permitir DraftPrescriptionItem[] aqui
    const prescriptionData: Omit<Prescription, 'id' | 'items'> & { items: DraftPrescriptionItem[] } = {
      bedId: bedId, // Usar bedId diretamente, já foi validado
      prescriptionDate: new Date(),
      items: validItems, // Passa apenas os itens validados
      prescriberName: prescriberName || undefined,
      notes: generalNotes || undefined,
    };

    try {
      // A prop onSave espera Omit<Prescription, 'id'>,
      // mas nossa função addPrescription no contexto sabe lidar com items sem id.
      // @ts-ignore - Permitir passar Draft[] onde PrescriptionItem[] é esperado (contexto resolve)
      await onSave(prescriptionData);
      // onClose(); // O onSave no componente pai deve chamar onClose
    } catch (err) {
      console.error("Erro ao salvar prescrição:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido ao salvar.");
      // Não fecha o modal em caso de erro para o usuário ver a mensagem
    } finally {
      setIsLoading(false);
    }
  }, [bedId, items, prescriberName, generalNotes, onSave]);

  // Definição das classes padrão para inputs e textareas
  const standardInputClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";
  const standardItemInputClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"; // Um pouco menor para caber mais

  if (!isOpen || !bedId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      {/* Modal Content */} 
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">
            Adicionar Nova Prescrição (Leito {bedId}) {/* Idealmente mostrar número do leito */}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body Scrollable */} 
        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
          {/* Campos Gerais */} 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prescriberName" className="block text-sm font-medium text-gray-700">Nome do Prescritor (Opcional)</label>
              <input
                type="text"
                id="prescriberName"
                value={prescriberName}
                onChange={(e) => setPrescriberName(e.target.value)}
                disabled={isLoading}
                className={standardInputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="generalNotes" className="block text-sm font-medium text-gray-700">Observações Gerais da Prescrição (Opcional)</label>
            <textarea
              id="generalNotes"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              disabled={isLoading}
              className={standardInputClass}
            />
          </div>

          {/* Itens da Prescrição */} 
          <h3 className="text-lg font-medium text-gray-800 pt-4 border-t mt-4">Medicamentos</h3>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-3 border rounded bg-gray-50/50 relative space-y-2">
                 <p className="text-sm font-medium text-gray-600">Medicamento {index + 1}</p>
                {/* Botão Remover Item */} 
                {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isLoading}
                      className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                      title="Remover este medicamento"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                )}

                {/* Campos do Item */} 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <label htmlFor={`medName-${index}`} className="block text-xs font-medium text-gray-600">Nome <span className="text-red-500">*</span></label>
                    <input type="text" id={`medName-${index}`} value={item.medicationName} onChange={(e) => handleItemChange(index, 'medicationName', e.target.value)} required disabled={isLoading} className={standardItemInputClass}/>
                  </div>
                  <div>
                    <label htmlFor={`dosage-${index}`} className="block text-xs font-medium text-gray-600">Dose <span className="text-red-500">*</span></label>
                    <input type="text" id={`dosage-${index}`} value={item.dosage} onChange={(e) => handleItemChange(index, 'dosage', e.target.value)} required disabled={isLoading} className={standardItemInputClass}/>
                  </div>
                   <div>
                    <label htmlFor={`route-${index}`} className="block text-xs font-medium text-gray-600">Via <span className="text-red-500">*</span></label>
                    <input type="text" id={`route-${index}`} value={item.route} onChange={(e) => handleItemChange(index, 'route', e.target.value)} required disabled={isLoading} className={standardItemInputClass}/>
                  </div>
                   <div>
                    <label htmlFor={`frequency-${index}`} className="block text-xs font-medium text-gray-600">Frequência <span className="text-red-500">*</span></label>
                    <input type="text" id={`frequency-${index}`} value={item.frequency} onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} required disabled={isLoading} className={standardItemInputClass}/>
                  </div>
                   <div>
                    <label htmlFor={`duration-${index}`} className="block text-xs font-medium text-gray-600">Duração</label>
                    <input type="text" id={`duration-${index}`} value={item.duration} onChange={(e) => handleItemChange(index, 'duration', e.target.value)} disabled={isLoading} className={standardItemInputClass}/>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`itemNotes-${index}`} className="block text-xs font-medium text-gray-600">Obs. do Item</label>
                    <input type="text" id={`itemNotes-${index}`} value={item.notes} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} disabled={isLoading} className={standardItemInputClass}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Adicionar Item */} 
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar Medicamento
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">
              Erro: {error}
            </p>
          )}
        </div>

        {/* Footer */} 
        <div className="flex justify-end p-4 border-t border-gray-200 sticky bottom-0 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition duration-150 ease-in-out mr-3 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || items.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:bg-green-400"
          >
            {isLoading ? 'Salvando...' : 'Salvar Prescrição'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPrescriptionModal; 