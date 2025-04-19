'use client';

import { useState, useEffect, FormEvent } from 'react';
import { FinancialTransaction, FinancialCategory, TransactionType, PaymentMethod, Patient, Doctor } from '@/types';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select'; // Usaremos react-select para categorias

registerLocale('pt-BR', ptBR);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Partial<FinancialTransaction>) => void;
  initialData?: FinancialTransaction | null;
  transactionType: TransactionType;
  categories: FinancialCategory[];
  patients: Patient[];
  doctors: Doctor[];
}

// Opções para campos Select (não precisam estar dentro do componente)
const paymentMethodOptions: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
    { value: 'Dinheiro', label: 'Dinheiro' },
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito' },
    { value: 'PIX', label: 'PIX' },
    { value: 'Boleto Bancário', label: 'Boleto Bancário' },
    { value: 'Transferência Bancária (TED/DOC)', label: 'Transferência' },
    { value: 'Outro', label: 'Outro' },
];

// Adapta categorias para react-select
const categoryOptions = (categories: FinancialCategory[]) =>
    categories.map(cat => ({ value: cat.id, label: cat.name }));

// Novas opções para Pacientes e Médicos
const patientOptions = (patients: Patient[]) =>
    [{ value: null, label: 'Nenhum / Não aplicável' }, ...patients.map(p => ({ value: p.id, label: p.name }))];

const doctorOptions = (doctors: Doctor[]) =>
     [{ value: null, label: 'Nenhum / Não aplicável' }, ...doctors.map(d => ({ value: d.id, label: d.name }))];

// Estilos Select (mantidos)
const selectStyles = {
    control: (baseStyles: any, state: any) => ({
        ...baseStyles,
        borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
        '&:hover': { borderColor: state.isFocused ? '#6366f1' : '#9ca3af' },
    }),
     option: (baseStyles: any, state: any) => ({
        ...baseStyles,
        backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : 'white',
        color: state.isSelected ? 'white' : '#1f2937',
        '&:active': { backgroundColor: '#c7d2fe' },
    }),
};

export default function FinancialTransactionForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  transactionType,
  categories,
  patients,
  doctors,
}: Props) {
  // Estados do formulário
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [value, setValue] = useState<string>(''); // Usar string para input, converter depois
  const [dueDate, setDueDate] = useState<Date | null>(new Date()); // Vencimento
  const [notes, setNotes] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Popula o form se estiver editando
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setCategoryId(initialData.categoryId);
      setValue(initialData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.',','));
      setDueDate(initialData.dueDate ? parseISO(initialData.dueDate) : new Date());
      setNotes(initialData.notes || '');
      setPatientId(initialData.patientId || null);
      setDoctorId(initialData.doctorId || null);
    } else {
      // Reset form for new entry
      setDescription('');
      setCategoryId(null);
      setValue('');
      setDueDate(new Date());
      setNotes('');
      setPatientId(null);
      setDoctorId(null);
    }
  }, [initialData, isOpen]); // Depende de isOpen para resetar ao abrir para novo

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId || !value || !dueDate) {
        toast.error('Por favor, preencha Categoria, Valor e Data de Vencimento.');
        return;
    }
    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
        toast.error('Valor financeiro inválido. Use o formato 1234,56.');
        return;
    }

    // Montar o objeto base com todos os dados do form
    const formData: Partial<FinancialTransaction> = {
      // Se estiver editando, adiciona o ID
      ...(initialData && { id: initialData.id }),
      type: transactionType,
      description,
      categoryId,
      value: numericValue,
      dueDate: dueDate.toISOString().split('T')[0],
      notes: notes || undefined, // Garante undefined se vazio
      patientId: patientId || undefined,
      doctorId: doctorId || undefined,
    };

    // Envia o objeto (que terá ou não o ID)
    onSave(formData);
    onClose();
  };


  if (!isOpen) return null;

  return (
    // Modal structure
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-xl font-semibold">
            {initialData ? `Editar ${transactionType}` : `Nova ${transactionType}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Campo Categoria */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <Select
                instanceId="category-select"
                id="categoryId"
                options={categoryOptions(categories)}
                value={categoryOptions(categories).find(opt => opt.value === categoryId)}
                onChange={(selectedOption) => setCategoryId(selectedOption ? selectedOption.value : null)}
                placeholder="Selecione uma categoria..."
                isClearable
                required
                styles={selectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
            />
          </div>

           {/* Campo Valor */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
            <input
              type="text" // Usar text para permitir vírgula e formatação
              id="value"
              value={value}
              onChange={(e) => {
                 // Simples máscara para valor monetário PT-BR
                 let v = e.target.value.replace(/\D/g,''); // Remove tudo que não for dígito
                 v = (parseInt(v, 10) / 100).toFixed(2) + ''; // Divide por 100 e fixa 2 casas
                 v = v.replace(".", ","); // Troca ponto por vírgula
                 v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); // Adiciona ponto milhar
                 if (v === 'NaN' || v === '0,00') v = '';
                 setValue(v);
              }}
              required
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Campo Data Vencimento */}
           <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento *</label>
                <DatePicker
                    id="dueDate"
                    selected={dueDate}
                    onChange={(date: Date | null) => setDueDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    wrapperClassName="w-full"
                />
           </div>

           {/* Campo Notas */}
           <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
           </div>

           {/* TODO: Adicionar Selects para Paciente/Médico se necessário */}

          {/* Botões Salvar/Cancelar */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
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
              {initialData ? 'Salvar Alterações' : `Adicionar ${transactionType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 