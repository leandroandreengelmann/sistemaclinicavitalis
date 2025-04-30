'use client';

import React from 'react';
import { Prescription, PrescriptionItem } from '@/context/BedManagementContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ViewPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}

// Reutilizar o display de item aqui ou um similar
const DetailedPrescriptionItemDisplay: React.FC<{ item: PrescriptionItem }> = ({ item }) => (
  <div className="py-2 px-3 border-b border-gray-200 last:border-b-0 bg-white hover:bg-gray-50/50">
    <p className="font-medium text-gray-900">{item.medicationName}</p>
    <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-4">
      <span><strong>Dose:</strong> {item.dosage}</span>
      <span><strong>Via:</strong> {item.route}</span>
      <span><strong>Frequência:</strong> {item.frequency}</span>
      {item.duration && <span><strong>Duração:</strong> {item.duration}</span>}
    </div>
    {item.notes && <p className="text-xs text-gray-500 mt-1"><strong>Obs:</strong> {item.notes}</p>}
  </div>
);


const ViewPrescriptionModal: React.FC<ViewPrescriptionModalProps> = ({ isOpen, onClose, prescription }) => {

  if (!isOpen || !prescription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      {/* Modal Content */}
      <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-xl relative flex flex-col max-h-[90vh]">
        {/* Header Fixo */}
        <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            Detalhes da Prescrição
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Fechar modal">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body Rolável */}
        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
          {/* Infos Gerais */}
          <div className="mb-4 text-sm text-gray-700">
             <p><strong>Data da Prescrição:</strong> {new Date(prescription.prescriptionDate).toLocaleString('pt-BR')}</p>
             {prescription.prescriberName && <p><strong>Prescritor:</strong> {prescription.prescriberName}</p>}
             {prescription.notes && <p className="mt-2"><strong>Observações Gerais:</strong> {prescription.notes}</p>}
          </div>

          {/* Itens Detalhados */}
          <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
             <h3 className="text-md font-semibold p-3 bg-gray-50 border-b border-gray-200 text-gray-700">Medicamentos Prescritos</h3>
             {prescription.items.length > 0 ? (
                 <div className="divide-y divide-gray-200"> {/* Usar div ou ul? Div é mais flexível */}
                     {prescription.items.map(item => <DetailedPrescriptionItemDisplay key={item.id} item={item} />)}
                 </div>
             ) : (
                 <p className="p-3 text-sm text-gray-500 italic">Nenhum item nesta prescrição.</p>
             )}
          </div>
        </div>

        {/* Footer Fixo */}
        <div className="flex justify-end p-4 border-t border-gray-300 bg-gray-50 rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPrescriptionModal; 