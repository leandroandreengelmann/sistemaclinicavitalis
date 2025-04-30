'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBedManagement } from '@/context/BedManagementContext';
import { Bed, Room } from '@/context/BedManagementContext';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type BedFormData = Omit<Bed, 'id' | 'status' | 'statusHistory' | 'patientId' | 'admissionDate'>;

interface AddBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BedFormData) => Promise<void>;
  room: Room | null;
  bedToEdit?: Bed | null;
}

const AddBedModal: React.FC<AddBedModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  room, 
  bedToEdit 
}) => {
  const { rooms, getBedsByRoomId } = useBedManagement(); 
  
  const isEditing = !!bedToEdit;
  const editingRoomId = room?.id;

  const [number, setNumber] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedRoomIdState, setSelectedRoomIdState] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (isEditing && bedToEdit) {
        setNumber(bedToEdit.number || '');
        setType(bedToEdit.type || '');
        setLocation(bedToEdit.location || '');
        setNotes(bedToEdit.notes || '');
        setSelectedRoomIdState('');
      } else {
        setNumber('');
        setType('');
        setLocation('');
        setNotes('');
        if (rooms.length === 1) {
            setSelectedRoomIdState(rooms[0].id);
        } else {
            setSelectedRoomIdState('');
        }
      }
    } 
  }, [isOpen, isEditing, bedToEdit, rooms]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const targetRoomId = isEditing ? editingRoomId : selectedRoomIdState;

    if (!targetRoomId) {
        toast.error('Selecione um Quarto.');
        return;
    }

    if (!number) {
      toast.error('Informe o Número/Identificação do Leito.');
      return;
    }
    
    const roomBeds = getBedsByRoomId(targetRoomId);
    const conflictingBed = roomBeds.find(bed => 
        bed.number.toLowerCase() === number.toLowerCase() && 
        (!isEditing || bed.id !== bedToEdit.id)
    );

    if (conflictingBed){
        toast.error(`Já existe um leito "${number}" neste quarto.`);
        return;
    }

    const bedFormData: BedFormData = {
      roomId: targetRoomId,
      number,
      type: type || undefined,
      location: location || undefined,
      notes: notes || undefined,
    };

    try {
      await onSave(bedFormData);
    } catch (error) {
      console.error("Erro dentro do AddBedModal ao chamar onSave:", error);
    }
  }, [
    number, type, location, notes, selectedRoomIdState,
    isEditing, bedToEdit, editingRoomId, 
    onSave, 
    getBedsByRoomId 
  ]);

  if (!isOpen) return null;

  const modalTitle = isEditing ? `Editar Leito ${bedToEdit?.number}` : 'Adicionar Novo Leito';
  const saveButtonText = isEditing ? 'Salvar Alterações' : 'Adicionar Leito';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="bedRoom" className="block text-sm font-medium text-gray-700">Quarto <span className="text-red-500">*</span></label>
            {isEditing ? (
              <input
                type="text"
                id="bedRoomDisplay"
                value={room ? `Quarto ${room.number}${room.type ? ` (${room.type})` : ''}` : 'Erro: Quarto não encontrado'}
                readOnly 
                disabled 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
              />
            ) : (
              <select
                id="bedRoom"
                value={selectedRoomIdState}
                onChange={(e) => setSelectedRoomIdState(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="" disabled>Selecione um quarto</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Quarto {r.number} {r.type ? `(${r.type})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label htmlFor="bedNumber" className="block text-sm font-medium text-gray-700">Número/ID do Leito <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="bedNumber"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: A, B, 1, Janela"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bedType" className="block text-sm font-medium text-gray-700">Tipo</label>
              <input
                type="text"
                id="bedType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ex: Apartamento, UTI"
              />
            </div>
             <div>
              <label htmlFor="bedLocation" className="block text-sm font-medium text-gray-700">Localização</label>
              <input
                type="text"
                id="bedLocation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ex: Ala Sul, 3º Andar"
              />
            </div>
           </div>

          <div>
            <label htmlFor="bedNotes" className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              id="bedNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {saveButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBedModal;
