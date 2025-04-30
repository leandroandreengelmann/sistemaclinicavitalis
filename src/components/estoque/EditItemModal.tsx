'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem, StockUnit } from '@/types';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: InventoryItem | null; // Item a ser editado
}

// Opções (manter consistentes com AddItemModal)
const categories: InventoryItem['category'][] = ['Medicamento', 'Material Escritório', 'Outros'];
const units: StockUnit[] = ['unidade', 'caixa', 'frasco', 'pacote', 'rolo', 'litro', 'kg'];

// Tipo para os dados que podem ser editados (exclui id, quantity, createdAt, updatedAt)
type EditableItemData = Partial<Omit<InventoryItem, 'id' | 'quantity' | 'createdAt' | 'updatedAt'> >

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  // A função updateItem será adicionada ao contexto depois
  const { updateItem } = useInventory(); 

  // Estado do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Medicamento');
  const [unit, setUnit] = useState<StockUnit>('unidade');
  const [minLevel, setMinLevel] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState<number | '' >('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [lotNumber, setLotNumber] = useState('');

  // Preenche o formulário quando o item a ser editado muda
  useEffect(() => {
    if (isOpen && itemToEdit) {
      setName(itemToEdit.name);
      setDescription(itemToEdit.description ?? '');
      setCategory(itemToEdit.category);
      setUnit(itemToEdit.unit);
      setMinLevel(itemToEdit.minLevel);
      setSupplier(itemToEdit.supplier ?? '');
      setCost(itemToEdit.cost ?? '');
      setExpiryDate(itemToEdit.expiryDate ? parseISO(itemToEdit.expiryDate) : null);
      setLotNumber(itemToEdit.lotNumber ?? '');
    } 
    // Não precisa limpar ao fechar, pois o useEffect que preenche fará isso quando itemToEdit for null
  }, [isOpen, itemToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemToEdit) {
        toast.error("Erro: Item para edição não encontrado.");
        return;
    }

    if (!name || !category || !unit || minLevel < 0) {
      toast.error('Preencha os campos obrigatórios (Nome, Categoria, Unidade, Nível Mín.) corretamente.');
      return;
    }

    const updatedData: EditableItemData = {
      name,
      description: description || undefined,
      category,
      unit,
      minLevel,
      supplier: supplier || undefined,
      cost: cost === '' ? undefined : Number(cost),
      expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
      lotNumber: lotNumber || undefined,
    };

    try {
       // Chama a função updateItem (que será criada no contexto)
      updateItem(itemToEdit.id, updatedData);
      toast.success(`Item "${name}" atualizado com sucesso.`);
      onClose(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast.error("Falha ao atualizar o item.");
    }
  };

  if (!isOpen || !itemToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Editar Item: <span className="font-normal">{itemToEdit.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário - similar ao AddItemModal, mas sem Qtd. Inicial */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {/* Linha 1: Nome e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Nome do Item <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="editItemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="editItemCategory" className="block text-sm font-medium text-gray-700">Categoria <span className="text-red-500">*</span></label>
              <select
                id="editItemCategory"
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
            <label htmlFor="editItemDescription" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              id="editItemDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Linha 3: Unidade, Nív. Mínimo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Ajustado para 2 colunas */}
             <div>
              <label htmlFor="editItemUnit" className="block text-sm font-medium text-gray-700">Unidade <span className="text-red-500">*</span></label>
              <select
                id="editItemUnit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as StockUnit)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                 {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="editMinLevel" className="block text-sm font-medium text-gray-700">Nível Mínimo <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="editMinLevel"
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
              <label htmlFor="editItemSupplier" className="block text-sm font-medium text-gray-700">Fornecedor</label>
              <input
                type="text"
                id="editItemSupplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="editItemCost" className="block text-sm font-medium text-gray-700">Custo Unitário (R$)</label>
              <input
                type="number"
                id="editItemCost"
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
              <label htmlFor="editItemExpiryDate" className="block text-sm font-medium text-gray-700">Data de Validade</label>
               <DatePicker
                  id="editItemExpiryDate"
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
              <label htmlFor="editItemLotNumber" className="block text-sm font-medium text-gray-700">Número do Lote</label>
              <input
                type="text"
                id="editItemLotNumber"
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal; 