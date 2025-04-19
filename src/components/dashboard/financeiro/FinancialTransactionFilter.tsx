// src/components/dashboard/financeiro/FinancialTransactionFilter.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Select, { GroupBase, OptionsOrGroups } from 'react-select'; // Importar tipos adicionais se necessário
import DatePicker, { registerLocale } from 'react-datepicker';
import { FinancialCategory, TransactionType, TransactionStatus, PaymentMethod } from '@/types';
import { useFinancials } from '@/context/FinancialContext';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

// Interface para o estado dos filtros
export interface FilterState {
  description?: string;
  type?: TransactionType | null;
  status?: TransactionStatus[];
  categoryIds?: string[];
  paymentMethods?: PaymentMethod[];
  dateRangeType?: 'dueDate' | 'paymentDate';
  startDate?: Date | null;
  endDate?: Date | null;
}

interface Props {
  onFilterChange: (filters: FilterState) => void;
}

// Tipos para as opções do React Select
type SelectOption<T> = { value: T; label: string };

// Opções pré-definidas com tipos corretos
const typeOptions: ReadonlyArray<SelectOption<TransactionType | null>> = [
  { value: null, label: 'Todos (Tipo)' },
  { value: 'Receita', label: 'Receita' },
  { value: 'Despesa', label: 'Despesa' },
];

const statusOptions: ReadonlyArray<SelectOption<TransactionStatus>> = [
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Pago', label: 'Pago' },
  { value: 'Recebido', label: 'Recebido' },
  { value: 'Atrasado', label: 'Atrasado' },
  { value: 'Cancelado', label: 'Cancelado' },
];

const paymentMethodOptions: ReadonlyArray<SelectOption<PaymentMethod>> = [
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
  { value: 'Cartão de Débito', label: 'Cartão de Débito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'Boleto Bancário', label: 'Boleto Bancário' },
  { value: 'Transferência Bancária (TED/DOC)', label: 'Transferência' },
  { value: 'Outro', label: 'Outro' },
];

const dateRangeTypeOptions: ReadonlyArray<SelectOption<'dueDate' | 'paymentDate'>> = [
    { value: 'dueDate', label: 'Vencimento'},
    { value: 'paymentDate', label: 'Pagamento'}
];

// Estilos para react-select
const selectStyles = {
    control: (baseStyles: any, state: any) => ({
        ...baseStyles,
        borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
        '&:hover': { borderColor: state.isFocused ? '#6366f1' : '#9ca3af' },
        minHeight: '38px',
        height: '38px',
    }),
    valueContainer: (base: any) => ({ ...base, height: '38px', padding: '0 6px' }),
    input: (base: any) => ({ ...base, margin: '0px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '38px' }),
    option: (baseStyles: any, state: any) => ({
        ...baseStyles,
        backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#e0e7ff' : 'white',
        color: state.isSelected ? 'white' : '#1f2937',
        '&:active': { backgroundColor: '#c7d2fe' },
    }),
     multiValue: (base: any) => ({ ...base, backgroundColor: '#e0e7ff' }),
     multiValueLabel: (base: any) => ({ ...base, color: '#4f46e5' }),
     multiValueRemove: (base: any) => ({ ...base, color: '#4f46e5', ':hover': { backgroundColor: '#c7d2fe', color: '#4338ca' } }),
};

export default function FinancialTransactionFilter({ onFilterChange }: Props) {
  const { categories } = useFinancials();

  // Estados locais para cada filtro
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<SelectOption<TransactionType | null>>(typeOptions[0]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReadonlyArray<SelectOption<TransactionStatus>>>([]);
  const [selectedCategories, setSelectedCategories] = useState<ReadonlyArray<SelectOption<string>>>([]);
  const [selectedPayMethods, setSelectedPayMethods] = useState<ReadonlyArray<SelectOption<PaymentMethod>>>([]);
  const [selectedDateRangeType, setSelectedDateRangeType] = useState<SelectOption<'dueDate' | 'paymentDate'>>(dateRangeTypeOptions[0]);
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));

  // Transforma categorias para opções do Select
  const categoryOptions: ReadonlyArray<SelectOption<string>> = categories.map(cat => ({ value: cat.id, label: cat.name }));

  // Função para montar e enviar o objeto de filtros
  const triggerFilterChange = useCallback(() => {
    const filters: FilterState = {
      description: description || undefined,
      type: selectedType?.value,
      status: selectedStatuses.map(s => s.value),
      categoryIds: selectedCategories.map(c => c.value),
      paymentMethods: selectedPayMethods.map(p => p.value),
      dateRangeType: selectedDateRangeType?.value,
      startDate: startDate,
      endDate: endDate,
    };
    // Remover arrays vazios para não poluir o objeto de filtro
    if (filters.status?.length === 0) delete filters.status;
    if (filters.categoryIds?.length === 0) delete filters.categoryIds;
    if (filters.paymentMethods?.length === 0) delete filters.paymentMethods;

    onFilterChange(filters);
  }, [description, selectedType, selectedStatuses, selectedCategories, selectedPayMethods, selectedDateRangeType, startDate, endDate, onFilterChange]);

  // Atualiza filtros quando um estado local muda
  useEffect(() => {
    triggerFilterChange();
  }, [triggerFilterChange]);

  const clearFilters = () => {
      setDescription('');
      setSelectedType(typeOptions[0]);
      setSelectedStatuses([]);
      setSelectedCategories([]);
      setSelectedPayMethods([]);
      setSelectedDateRangeType(dateRangeTypeOptions[0]);
      setStartDate(null);
      setEndDate(null);
      // triggerFilterChange será chamado pelo useEffect
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6 border border-gray-200">
      <h3 className="text-lg font-medium mb-4 text-gray-700">Filtros</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Filtro Descrição */}
        <div className="col-span-1">
          <label htmlFor="filter-description" className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
          <input
            type="text"
            id="filter-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filtro Tipo */}
        <div className="col-span-1">
            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
            <Select<SelectOption<TransactionType | null>>
                instanceId="filter-type-select"
                id="filter-type"
                options={typeOptions}
                value={selectedType}
                onChange={(option) => setSelectedType(option ?? typeOptions[0])}
                styles={selectStyles}
                placeholder="Tipo..."
                className="text-sm"
                isClearable={false}
            />
        </div>

         {/* Filtro Status */}
         <div className="col-span-1">
             <label htmlFor="filter-status" className="block text-sm font-medium text-gray-600 mb-1">Status</label>
             <Select<SelectOption<TransactionStatus>, true> // Indica que é multi-select
                 instanceId="filter-status-select"
                 id="filter-status"
                 isMulti
                 options={statusOptions}
                 value={selectedStatuses}
                 onChange={(options) => setSelectedStatuses(options)}
                 styles={selectStyles}
                 placeholder="Status..."
                 closeMenuOnSelect={false}
                 hideSelectedOptions={false}
                 className="text-sm"
             />
         </div>

         {/* Filtro Categoria */}
         <div className="col-span-1">
             <label htmlFor="filter-category" className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
             <Select<SelectOption<string>, true> // Indica que é multi-select
                 instanceId="filter-category-select"
                 id="filter-category"
                 isMulti
                 options={categoryOptions}
                 value={selectedCategories}
                 onChange={(options) => setSelectedCategories(options)}
                 styles={selectStyles}
                 placeholder="Categoria(s)..."
                 closeMenuOnSelect={false}
                 hideSelectedOptions={false}
                 className="text-sm"
             />
         </div>

         {/* Filtro Forma Pagamento */}
         <div className="col-span-1">
             <label htmlFor="filter-payment" className="block text-sm font-medium text-gray-600 mb-1">Forma Pagamento</label>
             <Select<SelectOption<PaymentMethod>, true> // Indica que é multi-select
                 instanceId="filter-payment-select"
                 id="filter-payment"
                 isMulti
                 options={paymentMethodOptions}
                 value={selectedPayMethods}
                 onChange={(options) => setSelectedPayMethods(options)}
                 styles={selectStyles}
                 placeholder="Pagamento(s)..."
                 closeMenuOnSelect={false}
                 hideSelectedOptions={false}
                 className="text-sm"
             />
         </div>

        {/* Filtro Período */}
        <div className="col-span-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:col-span-3 grid grid-cols-3 gap-4 items-end">
             <div>
                <label htmlFor="filter-date-type" className="block text-sm font-medium text-gray-600 mb-1">Filtrar Data Por</label>
                <Select<SelectOption<'dueDate' | 'paymentDate'>>
                     instanceId="filter-date-type-select-instance"
                     id="filter-date-type"
                     options={dateRangeTypeOptions}
                     value={selectedDateRangeType}
                     onChange={(option) => setSelectedDateRangeType(option ?? dateRangeTypeOptions[0])}
                     styles={selectStyles}
                     className="text-sm"
                     isClearable={false}
                 />
             </div>
             <div>
                <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-600 mb-1">Data Inicial</label>
                <DatePicker
                    id="filter-start-date"
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Início"
                    locale={ptBR} // Passar locale aqui também
                    isClearable
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div>
                <label htmlFor="filter-end-date" className="block text-sm font-medium text-gray-600 mb-1">Data Final</label>
                <DatePicker
                    id="filter-end-date"
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate ?? undefined}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Fim"
                    locale={ptBR} // Passar locale aqui também
                    isClearable
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </div>
         {/* Botão Limpar Filtros */}
         <div className="col-span-full flex justify-end mt-3">
              <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
              >
                  Limpar Filtros
              </button>
          </div>
      </div>
    </div>
  );
}