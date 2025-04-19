export type TransactionType = 'Receita' | 'Despesa';
export type PaymentMethod = 'Cartão de Crédito' | 'Débito' | 'Transferência' | 'Dinheiro' | 'PIX';

export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Patient {
  id: string;
  name: string;
}

export interface Doctor {
  id: string;
  name: string;
}

export type FinancialTransactionStatus = 'Pendente' | 'Pago' | 'Recebido' | 'Atrasado' | 'Cancelado';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  description: string;
  categoryId: string;
  value: number;
  dueDate: string;
  paymentDate?: string;
  status: FinancialTransactionStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  patientId?: string;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
} 