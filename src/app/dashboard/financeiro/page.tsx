'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FinancialTransactionTable from '@/components/dashboard/financeiro/FinancialTransactionTable';
import FinancialTransactionFilter, { FilterState } from '@/components/dashboard/financeiro/FinancialTransactionFilter';
import FinancialTransactionForm from '@/components/dashboard/financeiro/FinancialTransactionForm';
import MarkAsPaidModal from '@/components/dashboard/financeiro/MarkAsPaidModal';
import FinancialSummary from '@/components/dashboard/financeiro/FinancialSummary';
import { useFinancials } from '@/context/FinancialContext';
import { FinancialTransaction, TransactionType, PaymentMethod, Patient, Doctor, FinancialCategory } from '@/types';
import toast from 'react-hot-toast';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Importar dados JSON (substituir por API calls no futuro)
import patientsData from '@/data/patients.json';
import doctorsData from '@/data/doctors.json';

export default function FinanceiroPage() {
  const {
    transactions,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getCategoryById,
    markAsPaidReceived,
  } = useFinancials();

  const [filters, setFilters] = useState<FilterState>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [formType, setFormType] = useState<TransactionType | null>(null);

  const [isMarkAsPaidModalOpen, setIsMarkAsPaidModalOpen] = useState(false);
  const [transactionToMarkId, setTransactionToMarkId] = useState<string | null>(null);
  const [transactionTypeToMark, setTransactionTypeToMark] = useState<TransactionType>('Despesa');

  // Carregar dados de pacientes e médicos (aqui apenas para demonstração)
  const patients: Patient[] = patientsData;
  const doctors: Doctor[] = doctorsData;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filters.description && !tx.description.toLowerCase().includes(filters.description.toLowerCase())) {
        return false;
      }
      if (filters.type && tx.type !== filters.type) {
        return false;
      }
      if (filters.status && filters.status.length > 0 && !filters.status.includes(tx.status)) {
        return false;
      }
      if (filters.categoryIds && filters.categoryIds.length > 0 && !filters.categoryIds.includes(tx.categoryId)) {
        return false;
      }
      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        if (!tx.paymentMethod || !filters.paymentMethods.includes(tx.paymentMethod)) {
          return false;
        }
      }

      if (filters.startDate || filters.endDate) {
        const dateToFilter = filters.dateRangeType === 'paymentDate' ? tx.paymentDate : tx.dueDate;
        if (!dateToFilter) return false;

        const transactionDate = startOfDay(parseISO(dateToFilter));
        const start = filters.startDate ? startOfDay(filters.startDate) : null;
        const end = filters.endDate ? endOfDay(filters.endDate) : null;

        if (start && end) {
          if (!isWithinInterval(transactionDate, { start, end })) return false;
        } else if (start) {
          if (transactionDate < start) return false;
        } else if (end) {
          if (transactionDate > end) return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  const handleOpenForm = (type: TransactionType, transaction?: FinancialTransaction) => {
    setFormType(type);
    setEditingTransaction(transaction || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
    setFormType(null);
  };

  const handleSaveTransaction = (formData: Partial<FinancialTransaction>) => {
    try {
      if (formData.id) {
        const existingTransaction = getTransactionById(formData.id);
        if (!existingTransaction) throw new Error("Transação não encontrada para atualização");

        const updatedData: FinancialTransaction = {
          ...existingTransaction,
          ...formData,
          type: formData.type ?? existingTransaction.type,
          description: formData.description ?? existingTransaction.description,
          categoryId: formData.categoryId ?? existingTransaction.categoryId,
          value: formData.value ?? existingTransaction.value,
          dueDate: formData.dueDate ?? existingTransaction.dueDate,
        };
        updateTransaction(updatedData);
        toast.success("Transação atualizada!");
      } else if (formType) {
        if (!formData.type || !formData.description || !formData.categoryId || formData.value === undefined || !formData.dueDate) {
          throw new Error("Dados incompletos para criar a transação.");
        }
        addTransaction(formData as Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt' | 'status'>);
        toast.success(`${formType} adicionada com sucesso!`);
      }
      handleCloseForm();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao salvar: ${message}`);
    }
  };

  const handleDelete = (id: string) => {
    const transaction = getTransactionById(id);
    if (!transaction) return;

    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir<br/>a transação <b>{transaction.description}</b> ({transaction.type})?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                deleteTransaction(id);
                toast.success(`Transação excluída!`, { id: t.id });
              } catch (error) {
                console.error("Erro ao excluir transação:", error);
                toast.error("Falha ao excluir transação.", { id: t.id });
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </span>
    ), { duration: 8000 });
  };

  const handleOpenMarkAsPaidModal = (transactionId: string) => {
    const transaction = getTransactionById(transactionId);
    if (transaction) {
      setTransactionToMarkId(transactionId);
      setTransactionTypeToMark(transaction.type);
      setIsMarkAsPaidModalOpen(true);
    }
  };

  const handleCloseMarkAsPaidModal = () => {
    setIsMarkAsPaidModalOpen(false);
    setTransactionToMarkId(null);
  };

  const handleConfirmMarkAsPaid = (paymentDate: string, paymentMethod: PaymentMethod) => {
    if (!transactionToMarkId) return;
    try {
      markAsPaidReceived(transactionToMarkId, paymentDate, paymentMethod);
      toast.success(`Transação marcada como ${transactionTypeToMark === 'Receita' ? 'Recebida' : 'Paga'}!`);
      handleCloseMarkAsPaidModal();
    } catch (error) {
      console.error("Erro ao marcar como pago/recebido:", error);
      toast.error("Erro ao atualizar status da transação.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Visão Geral Financeira</h1>
        </div>

        <FinancialSummary transactions={filteredTransactions} />

        <FinancialTransactionFilter onFilterChange={setFilters} />
        
        <div className="my-6 flex justify-end gap-2">
           <button
             onClick={() => handleOpenForm('Receita')}
             className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm shadow-sm"
           >
             + Nova Receita
           </button>
           <button
             onClick={() => handleOpenForm('Despesa')}
             className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm shadow-sm"
           >
             + Nova Despesa
           </button>
        </div>

        <FinancialTransactionTable
          transactions={filteredTransactions}
          onEdit={(tx) => handleOpenForm(tx.type, tx)}
          onDelete={handleDelete}
          getCategoryName={(id) => getCategoryById(id)?.name || 'N/A'}
          onMarkAsPaidReceived={handleOpenMarkAsPaidModal}
        />

        {isFormOpen && formType && (
          <FinancialTransactionForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSave={handleSaveTransaction}
            initialData={editingTransaction}
            transactionType={formType}
            categories={categories.filter(cat => cat.type === formType)}
            patients={patients}
            doctors={doctors}
          />
        )}

        <MarkAsPaidModal
          isOpen={isMarkAsPaidModalOpen}
          onClose={handleCloseMarkAsPaidModal}
          onConfirm={handleConfirmMarkAsPaid}
          transactionType={transactionTypeToMark}
        />
      </div>
    </DashboardLayout>
  );
} 