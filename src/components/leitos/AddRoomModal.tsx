'use client';

import React, { useState, useEffect } from 'react';
import { useBedManagement } from '@/context/BedManagementContext';
import { Room } from '@/types';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose }) => {
  const { addRoom } = useBedManagement();

  // Estado do formulário
  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  // Limpa o formulário quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setNumber('');
      setFloor('');
      setType('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!number) {
      toast.error('O número do quarto é obrigatório.');
      return;
    }

    const roomData: Omit<Room, 'id'> = {
      number,
      floor: floor || undefined,
      type: type || undefined,
      notes: notes || undefined,
    };

    try {
      addRoom(roomData);
      onClose(); // Fecha o modal após sucesso
    } catch (error) {
      console.error("Erro ao adicionar quarto:", error);
      // O toast de erro já deve ter sido mostrado pelo contexto (se houver duplicidade)
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Adicionar Novo Quarto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">Número do Quarto <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="roomNumber"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: 101, 203A, UTI-05"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="roomFloor" className="block text-sm font-medium text-gray-700">Andar</label>
              <input
                type="text"
                id="roomFloor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ex: 1º, Térreo"
              />
            </div>
             <div>
              <label htmlFor="roomType" className="block text-sm font-medium text-gray-700">Tipo de Quarto</label>
              <input
                type="text"
                id="roomType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ex: Apartamento, Enfermaria"
              />
            </div>
           </div>

          <div>
            <label htmlFor="roomNotes" className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              id="roomNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Botões */}
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Salvar Quarto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModal; 