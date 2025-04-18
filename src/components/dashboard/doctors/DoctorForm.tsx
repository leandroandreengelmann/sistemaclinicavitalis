import React, { useState, useEffect, FormEvent } from 'react';
import { Doctor } from '@/types';
import toast from 'react-hot-toast';

interface DoctorFormProps {
  initialData: Doctor | null;
  onSave: (formData: Omit<Doctor, 'id'>) => void;
  onClose: () => void;
}

const DoctorForm: React.FC<DoctorFormProps> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
    } else {
      setName(''); // Reset form
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome do médico é obrigatório.');
      return;
    }
    onSave({ name: name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? 'Editar Médico' : 'Adicionar Novo Médico'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input 
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Dr. João Silva"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {initialData ? 'Salvar Alterações' : 'Adicionar Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm; 