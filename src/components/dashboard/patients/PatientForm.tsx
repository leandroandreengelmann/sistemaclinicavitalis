import React, { useState, useEffect, FormEvent } from 'react';
import { Patient } from '@/types';
import toast from 'react-hot-toast';

interface PatientFormProps {
  initialData: Patient | null;
  onSave: (formData: Omit<Patient, 'id'>) => void;
  onClose: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
    } else {
      // Reset form for new patient
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Basic validation (can be expanded)
    if (!name) {
      toast.error('O nome do paciente é obrigatório.');
      return;
    }
    onSave({ name, email, phone });
  };

  return (
    // Modal Overlay (fixed position, covers screen)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input 
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input 
              type="tel" // Use type="tel" for phone numbers
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              type="button" // Important: type="button" to prevent form submission
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {initialData ? 'Salvar Alterações' : 'Adicionar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm; 