'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { HealthPlan } from '@/types/index';
import toast from 'react-hot-toast';

interface HealthPlanFormProps {
  initialData: HealthPlan | null; // Null para adição, objeto para edição
  onSave: (formData: Omit<HealthPlan, 'id'>) => void;
  onClose: () => void; // Para cancelar ou fechar
}

const HealthPlanForm: React.FC<HealthPlanFormProps> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setRegistrationCode(initialData.registrationCode || '');
      setContactPerson(initialData.contactPerson || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setNotes(initialData.notes || '');
    } else {
      // Resetar para formulário de adição
      setName('');
      setRegistrationCode('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome do plano de saúde é obrigatório.');
      return;
    }
    onSave({
      name: name.trim(),
      registrationCode: registrationCode.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome (Obrigatório) */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Nome da Operadora ou Plano"
        />
      </div>

      {/* Código de Registro (Opcional) */}
      <div>
        <label htmlFor="registrationCode" className="block text-sm font-medium text-gray-700 mb-1">Código de Registro (Ex: ANS)</label>
        <input
          type="text"
          id="registrationCode"
          value={registrationCode}
          onChange={(e) => setRegistrationCode(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Opcional"
        />
      </div>

      {/* Contato (Opcional) */}
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
        <input
          type="text"
          id="contactPerson"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Opcional"
        />
      </div>

      {/* Telefone (Opcional) */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Opcional"
        />
      </div>

      {/* Email (Opcional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Opcional"
        />
      </div>

      {/* Notas (Opcional) */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Informações adicionais (opcional)"
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button" // Impede submit do formulário
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {initialData ? 'Salvar Alterações' : 'Cadastrar Plano'}
        </button>
      </div>
    </form>
  );
};

export default HealthPlanForm; 