'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem } from '@/types';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null; // ID do item para dar entrada
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, itemId }) => {
  const { addStock, getItemById } = useInventory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<number | '' >('');
  const [reason, setReason] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);

  // Carrega dados do item quando o modal abre com um itemId
  useEffect(() => {
    if (isOpen && itemId) {
      const currentItem = getItemById(itemId);
      if (currentItem) {
        setItem(currentItem);
        // Limpa os campos específicos da entrada
        setQuantity('');
        setReason('');
        setLotNumber(currentItem.lotNumber ?? ''); // Sugere o lote atual
        setExpiryDate(currentItem.expiryDate ? new Date(currentItem.expiryDate + 'T00:00:00') : null); // Sugere a validade atual
      } else {
        toast.error("Item não encontrado!");
        onClose(); // Fecha se o item não for achado
      }
    } else {
      setItem(null); // Limpa o item se fechar ou não tiver ID
    }
  }, [isOpen, itemId, getItemById, onClose]);

  // Determina se a unidade é inteira
  const isIntegerUnit = useMemo(() => {
    if (!item) return true; // Assume inteiro por padrão se item não carregado
    return ['unidade', 'caixa', 'frasco', 'pacote', 'rolo'].includes(item.unit);
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentQuantity = Number(quantity); // Convertido para número

    if (!itemId || quantity === '' || currentQuantity <= 0) {
      toast.error('Por favor, informe uma quantidade positiva para a entrada.');
      return;
    }

    // Validação para inteiros
    if (isIntegerUnit && !Number.isInteger(currentQuantity)) {
       toast.error(`Quantidade para "${item?.unit}" deve ser um número inteiro.`);
       return;
    }

    // Formata a data para YYYY-MM-DD ou passa undefined
    const formattedExpiry = expiryDate ? expiryDate.toISOString().split('T')[0] : undefined;

    try {
      addStock(itemId, currentQuantity, reason || undefined, lotNumber || undefined, formattedExpiry);
      onClose(); // Fecha o modal após sucesso
    } catch (error) {
      console.error("Erro ao dar entrada no estoque:", error);
      // Toast de erro geralmente já vem do contexto
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Dar Entrada: <span className='font-normal'>{item.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quantidade */}
          <div>
            <label htmlFor="entryQuantity" className="block text-sm font-medium text-gray-700">Quantidade a Adicionar ({item.unit}) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="entryQuantity"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                setQuantity(val === '' ? '' : Number(val)); 
              }}
              required
              min={isIntegerUnit ? "1" : "0.01"}
              step={isIntegerUnit ? "1" : "any"}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

           {/* Lote e Validade (Opcional, mas pode atualizar o item) */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="entryLotNumber" className="block text-sm font-medium text-gray-700">Nº Lote (Opcional)</label>
              <input
                type="text"
                id="entryLotNumber"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder={item.lotNumber ?? 'Nenhum'}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor="entryExpiryDate" className="block text-sm font-medium text-gray-700">Validade (Opcional)</label>
               <DatePicker
                  id="entryExpiryDate"
                  selected={expiryDate}
                  onChange={(date) => setExpiryDate(date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  isClearable
                  placeholderText={item.expiryDate ? format(parseISO(item.expiryDate), 'dd/MM/yyyy') : 'DD/MM/AAAA'}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label htmlFor="entryReason" className="block text-sm font-medium text-gray-700">Motivo/Observação (Opcional)</label>
            <input
              type="text"
              id="entryReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: Compra NF 123, Devolução"
            />
          </div>

          {/* Botões */}
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Confirmar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryModal; 