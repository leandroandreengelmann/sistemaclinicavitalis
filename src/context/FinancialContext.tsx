'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { FinancialTransaction, FinancialCategory, TransactionStatus, PaymentMethod } from '@/types/index'; // Importar tipos financeiros
import initialTransactionsData from '@/data/initialFinancialTransactions.json'; // Dados iniciais
import categoriesData from '@/data/categories.json'; // Dados de categorias
import { isPast, parseISO } from 'date-fns'; // Para verificar datas

const LOCAL_STORAGE_KEY = 'clinicFinancialTransactions'; // Nova chave

interface FinancialContextType {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[]; // Adicionar categorias ao contexto
  addTransaction: (newTransaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void; // Simplificar add
  updateTransaction: (updatedTransaction: FinancialTransaction) => void;
  deleteTransaction: (transactionId: string) => void;
  markAsPaidReceived: (transactionId: string, paymentDate: string, paymentMethod: PaymentMethod) => void;
  updateTransactionStatus: (transactionId: string, newStatus: TransactionStatus) => void; // Para Atrasado/Cancelado
  getTransactionById: (id: string) => FinancialTransaction | undefined; // Helper para buscar uma transação
  getCategoryById: (id: string) => FinancialCategory | undefined; // Helper para buscar categoria
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

interface FinancialProviderProps {
  children: ReactNode;
}

export const FinancialProvider: React.FC<FinancialProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories] = useState<FinancialCategory[]>(categoriesData as FinancialCategory[]); // Carregar categorias com assertion
  const [isLoading, setIsLoading] = useState(true);

  // Função para atualizar status baseado na data (será chamada periodicamente ou ao carregar)
  const checkAndUpdateStatuses = useCallback((currentTransactions: FinancialTransaction[]): FinancialTransaction[] => {
    const now = new Date();
    return currentTransactions.map(tx => {
      if (tx.status === 'Pendente' && isPast(parseISO(tx.dueDate)) && !tx.paymentDate) {
        // Verifica se está pendente, a data de vencimento passou E não tem data de pagamento
        return { ...tx, status: 'Atrasado' };
      }
      // Se foi pago/recebido mas depois marcado como pendente e venceu, voltar para atrasado
       if (tx.status === 'Pago' || tx.status === 'Recebido') {
         if(!tx.paymentDate && isPast(parseISO(tx.dueDate))){
             return { ...tx, status: 'Atrasado'};
         }
         if(!tx.paymentDate && !isPast(parseISO(tx.dueDate))){
            return { ...tx, status: 'Pendente'};
         }
       }

      return tx; // Retorna a transação sem modificação se não for o caso
    });
  }, []);


  // Carrega dados iniciais e atualiza status
  useEffect(() => {
    let dataToSet: FinancialTransaction[] = [];
    try {
      const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTransactions) {
        dataToSet = JSON.parse(storedTransactions);
      } else {
        dataToSet = initialTransactionsData as FinancialTransaction[];
      }
    } catch (error) {
      console.error("Erro ao carregar transações do localStorage:", error);
      dataToSet = initialTransactionsData as FinancialTransaction[];
    }

    // Atualiza status antes de definir o estado inicial
    const updatedTransactions = checkAndUpdateStatuses(dataToSet);
    setTransactions(updatedTransactions);
    setIsLoading(false);
  }, [checkAndUpdateStatuses]); // Adiciona a dependência

  // Salva no localStorage e atualiza status quando 'transactions' mudar
  useEffect(() => {
    if (!isLoading) {
      try {
        // Atualiza status antes de salvar
        const transactionsToSave = checkAndUpdateStatuses(transactions);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactionsToSave));
        // Se o estado local estiver dessincronizado com o que foi salvo (devido à atualização de status), sincroniza
        if (JSON.stringify(transactions) !== JSON.stringify(transactionsToSave)) {
             setTransactions(transactionsToSave); // Atualiza o estado local para refletir o status Atrasado, se necessário
        }
      } catch (error) {
        console.error("Erro ao salvar transações no localStorage:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, isLoading, checkAndUpdateStatuses]); // checkAndUpdateStatuses é estável devido ao useCallback

  const addTransaction = (newTransactionData: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
     const now = new Date().toISOString();
     const dueDate = parseISO(newTransactionData.dueDate);
     const isDue = isPast(dueDate);

     const newTransaction: FinancialTransaction = {
        ...newTransactionData,
        id: `trans-${Date.now()}-${Math.random().toString(16).slice(2)}`, // ID mais único
        status: isDue ? 'Atrasado' : 'Pendente', // Define status inicial baseado na data
        paymentDate: null, // Garante que começa sem data de pagamento
        paymentMethod: null, // Garante que começa sem método
        createdAt: now,
        updatedAt: now,
     };
     setTransactions((prev) => [...prev, newTransaction]);
  };

  const updateTransaction = (updatedTransactionData: FinancialTransaction) => {
    // Atualiza status antes de salvar a alteração
    const [transactionWithStatus] = checkAndUpdateStatuses([updatedTransactionData]);
    const finalTransaction = {
      ...transactionWithStatus,
      updatedAt: new Date().toISOString(),
    };
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === finalTransaction.id ? finalTransaction : tx))
    );
  };

  const deleteTransaction = (transactionId: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));
  };

  const markAsPaidReceived = (transactionId: string, paymentDateISO: string, paymentMethod: PaymentMethod) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === transactionId) {
          const newStatus: TransactionStatus = tx.type === 'Receita' ? 'Recebido' : 'Pago';
          return {
            ...tx,
            status: newStatus,
            paymentDate: paymentDateISO,
            paymentMethod: paymentMethod,
            updatedAt: new Date().toISOString(),
          };
        }
        return tx;
      })
    );
  };

  // Função para mudar status manualmente (ex: para Cancelado) ou reverter para Pendente/Atrasado
  const updateTransactionStatus = (transactionId: string, newStatus: TransactionStatus) => {
     setTransactions((prev) =>
        prev.map((tx) => {
           if (tx.id === transactionId) {
              let paymentDate = tx.paymentDate;
              let paymentMethod = tx.paymentMethod;
              // Se está voltando para Pendente ou Atrasado, limpar dados de pagamento
              if (newStatus === 'Pendente' || newStatus === 'Atrasado') {
                 paymentDate = null;
                 paymentMethod = null;
              }
              // Se for Atrasado, garantir que a data de vencimento já passou
              if (newStatus === 'Atrasado' && !isPast(parseISO(tx.dueDate))) {
                  newStatus = 'Pendente'; // Corrigir para Pendente se a data não venceu
              }
              // Se for Pendente, garantir que a data não passou
              if (newStatus === 'Pendente' && isPast(parseISO(tx.dueDate))) {
                  newStatus = 'Atrasado'; // Corrigir para Atrasado se já venceu
              }


              return {
                 ...tx,
                 status: newStatus,
                 paymentDate: paymentDate,
                 paymentMethod: paymentMethod,
                 updatedAt: new Date().toISOString(),
              };
           }
           return tx;
        })
     );
  };


  const getTransactionById = (id: string): FinancialTransaction | undefined => {
    return transactions.find(tx => tx.id === id);
  };

  const getCategoryById = (id: string): FinancialCategory | undefined => {
    return categories.find(cat => cat.id === id);
  };

  if (isLoading) {
    return <div>Carregando dados financeiros...</div>; // Ou um componente de loading melhor
  }

  return (
    <FinancialContext.Provider
      value={{
        transactions,
        categories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        markAsPaidReceived,
        updateTransactionStatus,
        getTransactionById,
        getCategoryById,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
}; 