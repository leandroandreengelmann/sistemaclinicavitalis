'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem, StockUnit } from '@/types';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Opções para selects (poderiam vir de um config)
const categories: InventoryItem['category'][] = ['Medicamento', 'Material Escritório', 'Outros'];
const units: StockUnit[] = ['unidade', 'caixa', 'frasco', 'pacote', 'rolo', 'litro', 'kg'];

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  const { addItem } = useInventory();

  // Estado do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Medicamento');
  const [unit, setUnit] = useState<StockUnit>('unidade');
  const [minLevel, setMinLevel] = useState<number>(0);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState<number | '' >('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [lotNumber, setLotNumber] = useState('');

  // Limpa o formulário quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setCategory('Medicamento');
      setUnit('unidade');
      setMinLevel(0);
      setInitialQuantity(0);
      setSupplier('');
      setCost('');
      setExpiryDate(null);
      setLotNumber('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || !unit || minLevel < 0 || initialQuantity < 0) {
      toast.error('Preencha os campos obrigatórios (Nome, Categoria, Unidade, Nível Mín., Qtd. Inicial) corretamente.');
      return;
    }

    const itemData: Omit<InventoryItem, 'id' | 'quantity' | 'createdAt' | 'updatedAt'> = {
      name,
      description: description || undefined,
      category,
      unit,
      minLevel,
      supplier: supplier || undefined,
      cost: cost === '' ? undefined : Number(cost),
      // Não inclui expiryDate e lotNumber aqui, pois serão passados como argumentos separados
    };

    // Formata a data para YYYY-MM-DD ou passa undefined
    const formattedExpiry = expiryDate ? expiryDate.toISOString().split('T')[0] : undefined;

    try {
      addItem(itemData, initialQuantity, lotNumber || undefined, formattedExpiry);
      onClose(); // Fecha o modal após sucesso
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      // O toast de erro já é mostrado dentro da função addItem do contexto
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Adicionar Novo Item ao Estoque</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Linha 1: Nome e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nome do Item <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">Categoria <span className="text-red-500">*</span></label>
              <select
                id="itemCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryItem['category'])}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              id="itemDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Linha 3: Unidade, Qtd. Inicial, Nív. Mínimo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
              <label htmlFor="itemUnit" className="block text-sm font-medium text-gray-700">Unidade <span className="text-red-500">*</span></label>
              <select
                id="itemUnit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as StockUnit)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                 {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="initialQuantity" className="block text-sm font-medium text-gray-700">Qtd. Inicial <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="initialQuantity"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
                required
                min="0"
                step="1" // Ajustar step se precisar de decimais
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="minLevel" className="block text-sm font-medium text-gray-700">Nível Mínimo <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="minLevel"
                value={minLevel}
                onChange={(e) => setMinLevel(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
                required
                min="0"
                step="1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Linha 4: Fornecedor e Custo */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemSupplier" className="block text-sm font-medium text-gray-700">Fornecedor</label>
              <input
                type="text"
                id="itemSupplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="itemCost" className="block text-sm font-medium text-gray-700">Custo Unitário (R$)</label>
              <input
                type="number"
                id="itemCost"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Linha 5: Validade e Lote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemExpiryDate" className="block text-sm font-medium text-gray-700">Data de Validade</label>
               <DatePicker
                  id="itemExpiryDate"
                  selected={expiryDate}
                  onChange={(date) => setExpiryDate(date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  isClearable
                  placeholderText="DD/MM/AAAA"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
             <div>
              <label htmlFor="itemLotNumber" className="block text-sm font-medium text-gray-700">Número do Lote</label>
              <input
                type="text"
                id="itemLotNumber"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Botões Ação */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Salvar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal; 