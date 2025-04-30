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
    // Modal Overlay adjusted for dark mode
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
      {/* Modal Content adjusted for dark mode */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4"> {/* Added mx-4 for small screen padding */}
        {/* Title adjusted for dark mode */}
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {initialData ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            {/* Label adjusted for dark mode */}
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            {/* Input adjusted for dark mode */}
            <input 
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
            />
          </div>
          <div className="mb-4">
             {/* Label adjusted for dark mode */}
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
             {/* Input adjusted for dark mode */}
            <input 
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
            />
          </div>
          <div className="mb-6">
             {/* Label adjusted for dark mode */}
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
             {/* Input adjusted for dark mode */}
            <input 
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
            />
          </div>
          <div className="flex justify-end space-x-3">
            {/* Cancel button adjusted for dark mode */}
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
            {/* Submit button adjusted for dark mode */}
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
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