'use client';

import React, { useState, useCallback } from 'react';
import { Bed, Prescription, PrescriptionItem, useBedManagement, BedStatus } from '@/context/BedManagementContext'; // Importar tipo Bed
import { usePatients, Patient } from '@/context/PatientsContext'; // Para buscar nome do paciente
import { XMarkIcon } from '@heroicons/react/24/solid';
import AddPrescriptionModal from './AddPrescriptionModal';
import ViewPrescriptionModal from './ViewPrescriptionModal'; // Importar novo modal
import toast from 'react-hot-toast';
// Importar PDFDownloadLink e o componente do documento
import { PDFDownloadLink } from '@react-pdf/renderer';
import PrescriptionReportDocument from '../reports/PrescriptionReportDocument'; // Ajustar caminho se necessário

interface HospitalizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed | null;
}

// Componente para exibir um item da prescrição (Layout Melhorado)
const PrescriptionItemDisplay: React.FC<{ item: PrescriptionItem }> = ({ item }) => (
  <li className="py-2 border-b border-gray-200 last:border-b-0">
    <p className="font-semibold text-gray-800 text-sm">{item.medicationName}</p>
    <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3"> {/* Usar flex para detalhes */}
      <span>Dose: {item.dosage}</span>
      <span>Via: {item.route}</span>
      <span>Freq: {item.frequency}</span>
      {item.duration && <span>Duração: {item.duration}</span>}
    </div>
    {item.notes && <p className="text-xs text-gray-500 mt-1">Obs: {item.notes}</p>}
  </li>
);

// Componente para exibir uma prescrição inteira (Layout Melhorado)
const PrescriptionDisplay: React.FC<{ 
  prescription: Prescription; 
  onClick: () => void;
}> = ({ prescription, onClick }) => (
  <div 
    onClick={onClick}
    className="mb-3 p-4 border rounded-lg bg-gray-50 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all duration-150 ease-in-out"
  >
    {/* Cabeçalho da Prescrição */} 
    <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-1">
      <span className="text-sm font-medium text-indigo-700">
        Prescrição de: {new Date(prescription.prescriptionDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>
      {prescription.prescriberName && 
        <span className="text-xs text-gray-500">Prescritor: {prescription.prescriberName}</span>
      }
    </div>
    {/* Notas Gerais */} 
    {prescription.notes && <p className="text-xs text-gray-600 italic mb-2">Obs. Geral: {prescription.notes}</p>}
    
    {/* Lista de Itens */} 
    <ul className="list-none pl-0 space-y-1"> {/* Adicionar espaçamento entre itens */}
      {prescription.items.length > 0 ? (
          prescription.items.map(item => <PrescriptionItemDisplay key={item.id} item={item} />)
      ) : (
          <li className="text-xs text-gray-400 italic">Nenhum medicamento nesta prescrição.</li>
      )}
    </ul>
  </div>
);

const HospitalizationDetailsModal: React.FC<HospitalizationDetailsModalProps> = ({ isOpen, onClose, bed }) => {
  // --- Hooks sempre no topo --- 
  const { getPatientById } = usePatients();
  const { getPrescriptionsByBedId, addPrescription, updateBed } = useBedManagement(); 
  const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
  // Novos estados para o modal de visualização
  const [isViewPrescriptionModalOpen, setIsViewPrescriptionModalOpen] = useState(false);
  const [selectedPrescriptionToView, setSelectedPrescriptionToView] = useState<Prescription | null>(null);
  const [isDischarging, setIsDischarging] = useState(false); // <<== Estado para controle da alta
  
  // Mover useCallback para o topo, antes de qualquer retorno condicional
  const handleSavePrescription = useCallback(async (prescriptionData: Omit<Prescription, 'id'>) => {
      // Precisamos de acesso a handleCloseAddPrescriptionModal aqui, então ela também não pode ser definida condicionalmente.
      // Vamos defini-la aqui também, ou movê-la para cima.
      // --> Mover handleClose para cima também.
      
      // No entanto, handleCloseAddPrescriptionModal só chama setIsAddPrescriptionModalOpen,
      // que é seguro chamar dentro do useCallback se estiver listado nas dependências.
      // Mas não é o ideal. Vamos definir handleClose fora e acima também.
      
      try {
          const newPrescription = await addPrescription(prescriptionData);
          if (newPrescription) {
              // Chamar a lógica de fechar diretamente (ou a função se definida acima)
              setIsAddPrescriptionModalOpen(false); 
          } 
      } catch (error) {
           console.error("Erro ao salvar prescrição (details modal):", error);
           toast.error("Erro ao tentar salvar a prescrição.");
      }
  }, [addPrescription]); // Remover handleClose das dependências, pois usamos setIs... diretamente

  // Mover handleClose para cima também
  const handleCloseAddPrescriptionModal = useCallback(() => {
      setIsAddPrescriptionModalOpen(false);
  }, []); // Sem dependências

  // Novas funções para controlar o modal de visualização
  const handleOpenViewPrescriptionModal = useCallback((prescription: Prescription) => {
      setSelectedPrescriptionToView(prescription);
      setIsViewPrescriptionModalOpen(true);
  }, []);
  
  const handleCloseViewPrescriptionModal = useCallback(() => {
      setIsViewPrescriptionModalOpen(false);
      setSelectedPrescriptionToView(null); // Limpa seleção ao fechar
  }, []);

  // Função para Dar Alta
  const handleDischargePatient = useCallback(async () => {
      if (!bed) return;

      if (window.confirm(`Tem certeza que deseja dar alta ao paciente internado no leito ${bed.number}? O status do leito mudará para Higienizando.`)) {
          setIsDischarging(true);
          try {
              const success = await updateBed(bed.id, { 
                  status: BedStatus.HIGIENIZANDO, 
                  patientId: null, 
                  admissionDate: null 
              });
              if (success) {
                  toast.success("Alta realizada com sucesso! Leito agora em Higienização.");
                  onClose(); // Fecha o modal de detalhes
              } else {
                  // O toast de erro específico deve vir do updateBed no contexto
                  toast.error("Falha ao atualizar o status do leito para dar alta.");
              }
          } catch (error) {
              console.error("Erro ao dar alta:", error);
              toast.error("Ocorreu um erro ao tentar dar alta.");
          } finally {
              setIsDischarging(false);
          }
      }
  }, [bed, updateBed, onClose]);

  // --- Lógica/Retorno Condicional --- 
  if (!isOpen || !bed) return null;

  // --- Variáveis e Lógica que dependem de props (depois do check) --- 
  const patient = bed.patientId ? getPatientById(bed.patientId) : null;
  const patientName = patient ? patient.name : 'Paciente não encontrado';
  const admissionDate = bed.admissionDate ? new Date(bed.admissionDate).toLocaleDateString('pt-BR') : 'Data não informada';
  const prescriptions = getPrescriptionsByBedId(bed.id);

  // --- Handlers que não são Hooks (podem ficar aqui) --- 
  const handleOpenAddPrescriptionModal = () => {
      setIsAddPrescriptionModalOpen(true);
  };
  
  // --- JSX --- 
  return (
    <>
      {/* === Modal Principal: Detalhes da Internação === */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative flex flex-col max-h-[90vh]">
          {/* Header Fixo */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">
              Detalhes da Internação - Leito {bed.number}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar modal">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body Rolável */}
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
             {/* Informações Paciente/Leito */} 
             <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p><strong>Paciente:</strong> {patientName}</p>
                <p><strong>Leito:</strong> {bed.number} {bed.location ? `(${bed.location})` : ''}</p>
                <p><strong>Admissão:</strong> {admissionDate}</p>
            </div>

            {/* Seção de Prescrições */} 
            <div className="mt-4">
                <h3 className="text-md font-semibold mb-2 text-gray-700 border-b pb-1">Prescrições Médicas</h3>
                {prescriptions.length > 0 ? (
                    <div>
                        {prescriptions.map(p => (
                            <PrescriptionDisplay 
                                key={p.id} 
                                prescription={p} 
                                onClick={() => handleOpenViewPrescriptionModal(p)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic mt-2">Nenhuma prescrição encontrada para este leito.</p>
                )}
            </div>

            {/* Botão Adicionar Prescrição (dentro da área rolável) */} 
            <div className="pt-4 text-right">
                <button
                onClick={handleOpenAddPrescriptionModal}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out"
                >
                Adicionar Nova Prescrição
                </button>
            </div>
          </div>

          {/* Footer Fixo - Mover todos os botões para a direita */}
          <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0 space-x-3"> {/* Usar justify-end e space-x */}
             {/* Botão Dar Alta */}
            <button
              onClick={handleDischargePatient}
              disabled={isDischarging}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDischarging ? 'Processando Alta...' : 'Dar Alta'} {/* Texto mais curto */} 
            </button>
             
            {/* Botão/Link para Download PDF */} 
            {patient && prescriptions.length > 0 ? (
                <PDFDownloadLink
                    document={<PrescriptionReportDocument patient={patient} prescriptions={prescriptions} />}
                    fileName={`prescricoes-${patient.name.replace(/\s+/g, '_')}-${bed?.number || 'leito'}.pdf`} // Adicionar fallback para bed.number
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out inline-block"
                >
                    {({ blob, url, loading, error }) => 
                       loading ? 'Gerando PDF...' : 'Baixar PDF' // Texto mais curto
                    }
                </PDFDownloadLink>
             ) : (
                <button
                    type="button" disabled
                    className="bg-cyan-300 text-white font-medium py-2 px-4 rounded cursor-not-allowed inline-block"
                    title={!patient ? "Paciente não encontrado" : "Nenhuma prescrição para gerar PDF"}
                >
                    Baixar PDF
                </button>
             )}
             
            {/* Botão Fechar */} 
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition duration-150 ease-in-out">
                Fechar
            </button>
          </div>
        </div>
      </div>

      {/* === Modal Secundário: Adicionar Prescrição === */}
      <AddPrescriptionModal 
        isOpen={isAddPrescriptionModalOpen}
        onClose={handleCloseAddPrescriptionModal}
        onSave={handleSavePrescription}
        bedId={bed.id} // Passa o ID do leito atual
      />
      
      {/* === Modal Terciário: Visualizar Prescrição === */} 
      <ViewPrescriptionModal 
        isOpen={isViewPrescriptionModalOpen}
        onClose={handleCloseViewPrescriptionModal}
        prescription={selectedPrescriptionToView}
      />
    </>
  );
};

export default HospitalizationDetailsModal; 