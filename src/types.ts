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

// --- Tipos para Controle de Estoque ---

export type StockUnit = 'unidade' | 'caixa' | 'frasco' | 'pacote' | 'rolo' | 'litro' | 'kg'; // Expandir conforme necessário

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: 'Medicamento' | 'Material Escritório' | 'Outros'; // Categoria do item
  unit: StockUnit;        // Unidade de medida
  quantity: number;       // Quantidade atual em estoque
  minLevel: number;       // Nível mínimo para alerta
  supplier?: string;      // Fornecedor
  cost?: number;          // Custo unitário (ou por lote)
  expiryDate?: string;    // Data de validade (ISO string YYYY-MM-DD)
  lotNumber?: string;     // Número do lote
  createdAt: string;      // Data de criação do registro do item
  updatedAt: string;      // Última atualização (entrada/saída)
}

export type MovementType = 'Entrada' | 'Saída' | 'AjusteInicial';

export interface StockMovement {
  id: string;
  itemId: string;         // ID do InventoryItem relacionado
  type: MovementType;
  quantityChange: number; // Positivo para entrada, negativo para saída
  reason?: string;        // Motivo da saída/ajuste (ex: Uso paciente X, Venda, Perda)
  timestamp: string;      // Data e hora da movimentação
  userId?: string;        // ID do usuário que realizou a ação (futuro)
  relatedLotNumber?: string; // Lote específico da movimentação
}
// --- Fim Tipos Estoque --- 

// --- Tipos para Gestão de Leitos ---

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved'; // Status possíveis

export interface Room {
  id: string;
  number: string; // Pode ser "101", "203A", etc.
  floor?: string; // Andar
  type?: string; // Ex: Apartamento, Enfermaria, UTI
  notes?: string;
}

export interface Bed {
  id: string;
  number: string; // Número/Identificação do leito dentro do quarto (ex: "A", "B", "1", "2")
  roomId: string; // FK para Room
  status: BedStatus;
  // Outras infos específicas do leito, se necessário (ex: tipo de cama)
}

export interface Hospitalization {
  id: string;
  patientId: string; // FK para Patient
  bedId: string;     // FK para Bed
  admissionDate: string; // Data e hora de entrada (ISO string)
  dischargeDate?: string; // Data e hora de alta (ISO string)
  reason?: string;    // Motivo da internação
  doctorId?: string;  // FK para Doctor (médico responsável)
  notes?: string;
}

// --- Fim Tipos Gestão de Leitos --- 