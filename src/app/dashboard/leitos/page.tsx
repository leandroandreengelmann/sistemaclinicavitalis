'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useBedManagement } from '@/context/BedManagementContext';
import { usePatients } from '@/context/PatientsContext';
// import type { Bed } from '@/types'; // <<== Comentar para evitar conflito
// import { BedStatus } from '@/types'; // Comentar import externo
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AddRoomModal from '@/components/leitos/AddRoomModal';
import AddBedModal from '@/components/leitos/AddBedModal';
import { UpdateBedStatusModal } from '@/components/leitos/UpdateBedStatusModal';
import { toast } from 'react-hot-toast';
import { FaProcedures } from "react-icons/fa";
import { TbBed } from "react-icons/tb";
// Importar o novo modal
import HospitalizationDetailsModal from '@/components/leitos/HospitalizationDetailsModal';

// --- Definição Local de BedStatus (Workaround para problema de importação/runtime) ---
enum BedStatus {
  LIVRE = 'Livre',
  OCUPADO = 'Ocupado',
  HIGIENIZANDO = 'Higienizando',
  DESATIVADO = 'Desativado',
}
// --- Fim Definição Local ---

// Mapa de estilos ajustado para dark mode
// @ts-ignore
const bedStatusStyles: Record<BedStatus, { bg: string; text: string; label: string; darkBg: string; darkText: string }> = {
  [BedStatus.LIVRE]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livre', darkBg: 'dark:bg-green-800/40', darkText: 'dark:text-green-200' },
  [BedStatus.OCUPADO]: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ocupado', darkBg: 'dark:bg-red-800/40', darkText: 'dark:text-red-200' },
  [BedStatus.HIGIENIZANDO]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Higienizando', darkBg: 'dark:bg-blue-800/40', darkText: 'dark:text-blue-200' },
  [BedStatus.DESATIVADO]: { bg: 'bg-gray-200', text: 'text-gray-800', label: 'Desativado', darkBg: 'dark:bg-gray-700/50', darkText: 'dark:text-gray-300' },
};

// Componente BedCard ajustado para dark mode
const BedCard: React.FC<{ 
    bed: any; 
    onClick: (bed: any) => void; 
    onDelete: (bedId: string) => void; 
    onEdit: (bed: any) => void; 
}> = ({ bed, onClick, onDelete, onEdit }) => {
  const { getPatientById } = usePatients();

  let patientName = '-';
  // @ts-ignore
  const patientId = bed.patientId;
  // @ts-ignore
  if (bed.status === BedStatus.OCUPADO && patientId) {
    const patient = getPatientById(patientId);
    // @ts-ignore
    patientName = patient ? patient.name : `ID: ${bed.patientId}`;
  }

  // @ts-ignore
  const statusStyle = bedStatusStyles[bed.status] || bedStatusStyles[BedStatus.DESATIVADO];

  return (
    <div
      onClick={() => onClick(bed)}
      // Applied dark mode styles from statusStyle
      className={`border dark:border-gray-700 rounded-lg p-4 shadow-sm ${statusStyle.bg} ${statusStyle.darkBg} relative group cursor-pointer flex flex-col items-center justify-center text-center hover:shadow-md dark:hover:shadow-gray-600/50 transition-shadow aspect-square`}
    >
       {/* Icon color adjusted */}
      <TbBed className={`w-16 h-16 mb-3 ${statusStyle.text} ${statusStyle.darkText}`} />

      {/* Bed number text adjusted */}
      <div className={`font-semibold text-sm ${statusStyle.text} ${statusStyle.darkText}`}>
         {bed.number} 
      </div>
      
      {/* Action buttons adjusted */}
      <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
             onClick={(e) => { e.stopPropagation(); onEdit(bed); }}
             title="Editar Leito" 
             // Buttons adjusted for better contrast in dark mode
             className="p-1 bg-white/70 dark:bg-gray-600/80 hover:bg-white dark:hover:bg-gray-500 rounded text-gray-600 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-300 shadow"
          >
              <PencilIcon className="h-4 w-4" />
          </button>
          <button 
             onClick={(e) => { e.stopPropagation(); onDelete(bed.id); }}
             title="Deletar Leito" 
             className="p-1 bg-white/70 dark:bg-gray-600/80 hover:bg-white dark:hover:bg-gray-500 rounded text-gray-600 dark:text-gray-200 hover:text-red-700 dark:hover:text-red-400 shadow"
          >
              <TrashIcon className="h-4 w-4" />
          </button>
      </div>
    </div>
  );
};

export default function GestaoLeitosPage() {
  const { 
    rooms, 
    beds, 
    isLoading, 
    getBedsByRoomId, 
    fetchData, 
    addRoom, 
    deleteRoom, 
    addBed,         // <<== Adicionar addBed que faltava nas desestruturação?
    updateBed,      // <<== Adicionar updateBed que faltava?
    deleteBed, 
    getRoomById,    // <<== Precisamos de getRoomById
    addPrescription, // <<== Adicionar do contexto
    getPrescriptionsByBedId, // <<== Adicionar do contexto
    // updateBedStatus - Não precisamos diretamente aqui agora
  } = useBedManagement();
  const { getPatientById } = usePatients();
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedBedForStatusUpdate, setSelectedBedForStatusUpdate] = useState<any>(null);
  const [isAddEditBedModalOpen, setIsAddEditBedModalOpen] = useState(false);
  const [bedToEdit, setBedToEdit] = useState<any>(null);
  const [selectedRoomForBedModal, setSelectedRoomForBedModal] = useState<any>(null);
  // Novos estados para o modal de Detalhes da Internação/Prescrição
  const [isHospitalizationDetailsModalOpen, setIsHospitalizationDetailsModalOpen] = useState(false);
  const [selectedBedForDetails, setSelectedBedForDetails] = useState<any>(null);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenUpdateStatusModal = useCallback((bed: any) => {
      setSelectedBedForStatusUpdate(bed);
      setIsUpdateStatusModalOpen(true);
  }, []);

  const handleCloseUpdateStatusModal = useCallback(() => {
      setIsUpdateStatusModalOpen(false);
      setSelectedBedForStatusUpdate(null);
  }, []);

  // NOVO: Handler para deletar quarto
  const handleDeleteRoom = useCallback(async (roomId: string) => {
    // Adicionar confirmação
    if (window.confirm("Tem certeza que deseja deletar este quarto? Todos os leitos associados também serão perdidos se não forem movidos antes!")) {
        // Validação extra (opcional): verificar se há leitos no quarto ANTES de chamar deleteRoom
        const bedsInRoom = getBedsByRoomId(roomId);
        if (bedsInRoom.length > 0) {
            toast.error("Não é possível deletar um quarto que contém leitos.");
            // Alternativa: Oferecer deletar leitos juntos ou mover?
            return;
        }
      try {
        // Chamar a função deleteRoom do contexto
        await deleteRoom(roomId); // <<== Descomentar esta linha
        // console.log(`Tentando deletar quarto: ${roomId}`); // <<== Remover simulação
        // toast.success("Quarto deletado com sucesso (simulação)."); // <<== Remover simulação (Toast vem do contexto)
        // A atualização da lista de rooms deve vir do estado gerenciado pelo contexto
      } catch (error) {
        console.error("Erro ao deletar quarto:", error);
        toast.error("Erro ao tentar deletar o quarto.");
      }
    }
  }, [deleteRoom, getBedsByRoomId]); // Manter dependências

  // NOVO: Handler para deletar leito
  const handleDeleteBed = useCallback(async (bedId: string) => {
    if (window.confirm("Tem certeza que deseja deletar este leito?")) {
      try {
        await deleteBed(bedId); // Chamar função do contexto
        // Toast de sucesso já vem do contexto/hook
      } catch (error) {
        console.error("Erro ao deletar leito:", error);
        toast.error("Erro ao tentar deletar o leito.");
      }
    }
  }, [deleteBed]);

  // Abrir modal para adicionar OU editar leito
  const handleOpenAddEditBedModal = useCallback((bed: any | null = null) => {
    if (bed) { // Editando um leito existente
      const room = getRoomById(bed.roomId);
      if (!room) {
        toast.error("Erro: Quarto do leito não encontrado.");
        return;
      }
      setSelectedRoomForBedModal(room); // Define o quarto para o modal (será read-only)
      setBedToEdit(bed); // Define o leito a ser editado
    } else { // Adicionando um novo leito (chamado pelo botão geral)
      setBedToEdit(null); // Garante que não estamos editando
      setSelectedRoomForBedModal(null); // Força o modal a mostrar o seletor de quarto
       // Poderia pré-selecionar se só houver 1 quarto?
       // if (rooms.length === 1) setSelectedRoomForBedModal(rooms[0]);
    }
    setIsAddEditBedModalOpen(true); // Abre o modal unificado
  }, [getRoomById, rooms]); // Adicionar rooms se for pré-selecionar

  // Fechar modal de adicionar/editar leito
  const handleCloseAddEditBedModal = useCallback(() => {
    setIsAddEditBedModalOpen(false);
    setSelectedRoomForBedModal(null);
    setBedToEdit(null);
  }, []);

  // Salvar (adicionar ou editar) leito
  const handleSaveBed = useCallback(async (bedData: any) => { // bedData agora inclui roomId quando adicionando
    try {
      if (bedToEdit) {
        // Editando: Chamar updateBed com o ID do leito e os dados atualizados.
        // O roomId não deve ser alterado na edição via este modal, 
        // então não precisamos passá-lo explicitamente, ele já está em bedToEdit
        // e a função updateBed do contexto não deve alterá-lo por padrão.
        // Apenas passamos os campos que podem ser mudados (number, type, location, notes)
        const { roomId, ...editableData } = bedData; // Remover roomId de bedData se ele veio
        await updateBed(bedToEdit.id, editableData); 
      } else {
        // Adicionando: Chamar addBed.
        // O AddBedModal agora inclui o roomId selecionado dentro do bedData.
        const roomId = bedData.roomId; // Pegar roomId de bedData
        if (!roomId) {
            toast.error("Erro interno: ID do Quarto não foi fornecido para adicionar leito.");
            return;
        }
        // Passar todos os dados (incluindo roomId) para addBed
        await addBed(bedData); 
      }
      handleCloseAddEditBedModal(); // Fecha o modal após salvar com sucesso
    } catch (error) {
        console.error("Erro ao salvar leito:", error);
        // O toast de erro já deve vir do contexto (addBed/updateBed)
        // Mas podemos adicionar um genérico aqui se a chamada falhar por outro motivo
        toast.error("Ocorreu um erro ao tentar salvar o leito.");
    }
  }, [bedToEdit, addBed, updateBed, handleCloseAddEditBedModal]); // Dependências atualizadas

  // Handler para abrir o modal correto ao clicar no card do leito
  const handleBedCardClick = useCallback((bed: any) => {
    // @ts-ignore - Comparação com enum local
    if (bed.status === BedStatus.OCUPADO) {
      // Se ocupado, abre modal de detalhes da internação/prescrição
      setSelectedBedForDetails(bed);
      setIsHospitalizationDetailsModalOpen(true);
    } else {
      // Se qualquer outro status, abre modal de atualização de status
      setSelectedBedForStatusUpdate(bed);
      setIsUpdateStatusModalOpen(true);
    }
  }, []); // Adicionar dependências se houver

  // Fechar modal de detalhes da internação
  const handleCloseHospitalizationDetails = useCallback(() => {
      setIsHospitalizationDetailsModalOpen(false);
      setSelectedBedForDetails(null);
  }, []);

  if (isLoading) {
    return <DashboardLayout><div>Carregando gestão de leitos...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Painel de Gestão de Leitos</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={() => setIsAddRoomModalOpen(true)}
              className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center shadow transition-colors"
            >
                 <PlusIcon className="h-5 w-5 mr-2"/>
                 Adicionar Quarto
             </button>
             <button 
               onClick={() => handleOpenAddEditBedModal()}
               className={`font-bold py-2 px-4 rounded inline-flex items-center shadow transition-colors ${rooms.length === 0 
                 ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                 : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white'}`}
               disabled={rooms.length === 0}
               title={rooms.length === 0 ? "Cadastre um quarto primeiro" : "Adicionar Leito"}
             >
                 <PlusIcon className="h-5 w-5 mr-2"/>
                 Adicionar Leito
             </button>
          </div>
        </div>

        {rooms.length === 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow text-center text-gray-500 dark:text-gray-400">
            Nenhum quarto cadastrado ainda.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const roomBeds = getBedsByRoomId(room.id);
            return (
              <div key={room.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
                <div className="flex justify-between items-center mb-3 border-b dark:border-gray-600 pb-2">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quarto {room.number}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {room.type ? `${room.type}` : ''}{room.floor ? ` - Andar ${room.floor}` : ''}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                     <button title="Editar Quarto" className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                         <PencilIcon className="h-5 w-5" />
                      </button>
                       <button 
                         onClick={() => handleDeleteRoom(room.id)}
                         title="Deletar Quarto" 
                         className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                       >
                         <TrashIcon className="h-5 w-5" />
                       </button>
                   </div>
                </div>
                
                {roomBeds.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {roomBeds.sort((a, b) => a.number.localeCompare(b.number)).map((bed) => (
                      <BedCard 
                        key={bed.id} 
                        bed={bed} 
                        onClick={handleBedCardClick}
                        onDelete={handleDeleteBed}
                        onEdit={handleOpenAddEditBedModal}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-400 dark:text-gray-500 italic mt-4">Nenhum leito cadastrado neste quarto.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
       <AddRoomModal 
         isOpen={isAddRoomModalOpen} 
         onClose={() => setIsAddRoomModalOpen(false)} 
       />
       <AddBedModal 
         isOpen={isAddEditBedModalOpen}
         onClose={handleCloseAddEditBedModal} 
         onSave={handleSaveBed}
         room={selectedRoomForBedModal}
         bedToEdit={bedToEdit}
       />
       <UpdateBedStatusModal
          isOpen={isUpdateStatusModalOpen}
          onClose={handleCloseUpdateStatusModal}
          bed={selectedBedForStatusUpdate}
       />
       
       <HospitalizationDetailsModal 
         isOpen={isHospitalizationDetailsModalOpen}
         onClose={handleCloseHospitalizationDetails}
         bed={selectedBedForDetails}
       />
       
    </DashboardLayout>
  );
} 