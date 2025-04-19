'use client';

import { useState, FormEvent } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import Select from 'react-select';
import { PaymentMethod, TransactionType } from '@/types';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';

registerLocale('pt-BR', ptBR); // Registrar locale globalmente

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentDate: string, paymentMethod: PaymentMethod) => void;
  transactionType: TransactionType;
}

// Reutilizando opções do form principal, mas poderiam ser importadas de um local comum
const paymentMethodOptions: readonly { value: PaymentMethod; label: string }[] = [
    // Garante uma opção vazia para forçar seleção
    { value: 'Dinheiro', label: 'Dinheiro' },
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito' },
    { value: 'PIX', label: 'PIX' },
    { value: 'Boleto Bancário', label: 'Boleto Bancário' },
    { value: 'Transferência Bancária (TED/DOC)', label: 'Transferência' },
    { value: 'Outro', label: 'Outro' },
];

// Estilos (podem ser importados se definidos globalmente)
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


export default function MarkAsPaidModal({ isOpen, onClose, onConfirm, transactionType }: Props) {
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date()); // Default hoje
  const [selectedMethod, setSelectedMethod] = useState<{ value: PaymentMethod; label: string } | null>(null);

  const handleConfirm = (e: FormEvent) => {
    e.preventDefault();
    if (!paymentDate || !selectedMethod) {
      toast.error("Por favor, selecione a data e a forma de pagamento.");
      return;
    }
    onConfirm(paymentDate.toISOString().split('T')[0], selectedMethod.value); // Envia YYYY-MM-DD e o valor
    handleClose(); // Fecha após confirmar
  };

  // Reset state on close
  const handleClose = () => {
      setPaymentDate(new Date());
      setSelectedMethod(null);
      onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-lg font-semibold">
            Confirmar {transactionType === 'Receita' ? 'Recebimento' : 'Pagamento'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Data Pagamento/Recebimento */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data do {transactionType === 'Receita' ? 'Recebimento' : 'Pagamento'} *
            </label>
            <DatePicker
              id="paymentDate"
              selected={paymentDate}
              onChange={(date) => setPaymentDate(date)}
              dateFormat="dd/MM/yyyy"
              locale={ptBR}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              wrapperClassName="w-full"
            />
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento *</label>
            <Select
              id="paymentMethod"
              options={paymentMethodOptions}
              value={selectedMethod}
              onChange={(option) => setSelectedMethod(option)}
              placeholder="Selecione..."
              required
              styles={selectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 