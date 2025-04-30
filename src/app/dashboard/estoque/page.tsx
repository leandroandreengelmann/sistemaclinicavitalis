'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem } from '@/types';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AddItemModal from '@/components/estoque/AddItemModal';
import EntryModal from '@/components/estoque/EntryModal';
import RemovalModal from '@/components/estoque/RemovalModal';
import EditItemModal from '@/components/estoque/EditItemModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Função para determinar a cor do status do estoque
const getStockStatusColor = (item: InventoryItem): string => {
  const isLowStock = item.quantity <= item.minLevel;
  let isNearExpiry = false;
  if (item.expiryDate) {
    try {
      const expiry = parseISO(item.expiryDate);
      const thirtyDaysFromNow = addDays(new Date(), 30);
      isNearExpiry = isBefore(expiry, thirtyDaysFromNow);
    } catch (e) { 
      console.error("Erro ao parsear data de validade:", item.expiryDate, e);
    }
  }

  if (isLowStock || isNearExpiry) {
    return 'text-red-600 font-semibold'; // Vermelho para estoque baixo ou perto de vencer
  } else if (item.quantity <= item.minLevel * 1.5) { // Exemplo: Amarelo se estiver até 50% acima do mínimo
    return 'text-yellow-600 font-semibold';
  } else {
    return 'text-green-600 font-semibold'; // Verde se ok
  }
};

export default function EstoquePage() {
  const { inventoryItems, isLoading, deleteItem, getItemById } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedItemIdForModal, setSelectedItemIdForModal] = useState<string | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funções para abrir modais de entrada/saída
  const handleOpenEntryModal = (itemId: string) => {
    setSelectedItemIdForModal(itemId);
    setIsEntryModalOpen(true);
  };

  const handleOpenRemovalModal = (itemId: string) => {
    setSelectedItemIdForModal(itemId);
    setIsRemovalModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItemForEdit(item);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteConfirm = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteConfirmOpen(true);
  };

  // Fechar modais (pode ser uma função única se preferir)
  const closeEntryModal = () => {
    setIsEntryModalOpen(false);
    setSelectedItemIdForModal(null);
  }
  const closeRemovalModal = () => {
    setIsRemovalModalOpen(false);
    setSelectedItemIdForModal(null);
  }
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItemForEdit(null);
  }
  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setItemToDelete(null);
  }

  // Função que realmente deleta (chamada pelo modal de confirmação)
  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id);
    }
    // O modal fecha automaticamente no onConfirm
  };

  if (isLoading) {
    return <DashboardLayout><div>Carregando estoque...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Controle de Estoque</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2"/>
            Adicionar Item
          </button>
        </div>

        {/* Barra de Busca e talvez Filtros */}
        <div className="bg-white p-4 rounded shadow">
           <input 
             type="text"
             placeholder="Buscar por nome, descrição ou categoria..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full border border-gray-300 rounded p-2"
           />
           {/* Adicionar outros filtros (categoria, status) aqui se necessário */}
        </div>

        {/* Tabela de Estoque */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Atual</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nív. Mín.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-center text-sm ${getStockStatusColor(item)}`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.minLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.expiryDate ? format(parseISO(item.expiryDate), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lotNumber ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleOpenEntryModal(item.id)}
                        title="Dar Entrada" 
                        className="text-green-600 hover:text-green-900 disabled:text-gray-300"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={() => handleOpenRemovalModal(item.id)}
                        title="Dar Baixa" 
                        className={`text-red-600 hover:text-red-900 ${item.quantity <= 0 ? 'text-gray-300 hover:text-gray-300 cursor-not-allowed' : ''}`}
                        disabled={item.quantity <= 0}
                      >
                        <ArrowUpTrayIcon className="h-5 w-5"/>
                      </button>
                       <button 
                        onClick={() => handleOpenEditModal(item)}
                        title="Editar Item" 
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-300"
                      >
                        <PencilIcon className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteConfirm(item)}
                        title="Excluir Item" 
                        className="text-gray-400 hover:text-red-600 disabled:text-gray-300"
                      >
                        <TrashIcon className="h-5 w-5"/>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    {inventoryItems.length === 0 ? 'Nenhum item cadastrado no estoque.' : 'Nenhum item encontrado para a busca.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      <EntryModal 
        isOpen={isEntryModalOpen} 
        onClose={closeEntryModal} 
        itemId={selectedItemIdForModal} 
      />
      <RemovalModal 
        isOpen={isRemovalModalOpen} 
        onClose={closeRemovalModal} 
        itemId={selectedItemIdForModal} 
      />
      <EditItemModal 
        isOpen={isEditModalOpen} 
        onClose={closeEditModal} 
        itemToEdit={selectedItemForEdit} 
      />
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteItem}
        title="Confirmar Exclusão"
        message={
          <span>
            Tem certeza que deseja excluir o item "
            <strong className="font-semibold">{itemToDelete?.name ?? ''}</strong>"?
            <br />
            Todo o histórico de movimentações também será perdido. <strong className="font-semibold">Esta ação não pode ser desfeita.</strong>
          </span>
        }
        confirmButtonText="Excluir"
        confirmButtonColor="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />

    </DashboardLayout>
  );
} 