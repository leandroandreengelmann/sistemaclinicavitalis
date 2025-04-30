'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem } from '@/types';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null; // ID do item para dar baixa
}

const RemovalModal: React.FC<RemovalModalProps> = ({ isOpen, onClose, itemId }) => {
  const { removeStock, getItemById } = useInventory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<number | '' >('');
  const [reason, setReason] = useState('');
  const [lotNumber, setLotNumber] = useState('');

  // Carrega dados do item quando o modal abre
  useEffect(() => {
    if (isOpen && itemId) {
      const currentItem = getItemById(itemId);
      if (currentItem) {
        setItem(currentItem);
        // Limpa campos
        setQuantity('');
        setReason('');
        setLotNumber(currentItem.lotNumber ?? ''); // Sugere lote atual para saída
      } else {
        toast.error("Item não encontrado!");
        onClose();
      }
    } else {
      setItem(null);
    }
  }, [isOpen, itemId, getItemById, onClose]);

  // Determina se a unidade é inteira
  const isIntegerUnit = useMemo(() => {
    if (!item) return true;
    return ['unidade', 'caixa', 'frasco', 'pacote', 'rolo'].includes(item.unit);
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentQuantity = Number(quantity);

    if (!itemId || !item || quantity === '' || currentQuantity <= 0) {
      toast.error('Informe uma quantidade positiva para a saída.');
      return;
    }

    // Validação para inteiros
    if (isIntegerUnit && !Number.isInteger(currentQuantity)) {
       toast.error(`Quantidade para "${item.unit}" deve ser um número inteiro.`);
       return;
    }

    if (currentQuantity > item.quantity) {
      toast.error(`Quantidade de saída (${currentQuantity}) maior que o estoque atual (${item.quantity}).`);
      return;
    }

    try {
      removeStock(itemId, currentQuantity, reason || undefined, lotNumber || undefined);
      onClose();
    } catch (error) {
      console.error("Erro ao dar baixa no estoque:", error);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Dar Baixa: <span className='font-normal'>{item.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Estoque Atual: <span className='font-medium'>{item.quantity} {item.unit}(s)</span></p>
          {/* Quantidade */}
          <div>
            <label htmlFor="removalQuantity" className="block text-sm font-medium text-gray-700">Quantidade a Remover ({item.unit}) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="removalQuantity"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                setQuantity(val === '' ? '' : Number(val));
              }}
              required
              min={isIntegerUnit ? "1" : "0.01"}
              max={item.quantity} // Não permite remover mais que o estoque
              step={isIntegerUnit ? "1" : "any"}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

           {/* Lote de Saída (Informativo para o log) */}
           <div>
            <label htmlFor="removalLotNumber" className="block text-sm font-medium text-gray-700">Nº Lote da Saída (Opcional)</label>
            <input
              type="text"
              id="removalLotNumber"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder={item.lotNumber ?? 'N/A'}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="removalReason" className="block text-sm font-medium text-gray-700">Motivo/Observação (Opcional)</label>
            <input
              type="text"
              id="removalReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: Uso Paciente X, Venda, Perda"
            />
          </div>

          {/* Botões */}
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Confirmar Baixa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemovalModal; 