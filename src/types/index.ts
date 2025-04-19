export interface Doctor {
  id: string;
  name: string;
  specialties?: string[]; // Lista de especialidades
  workingHours?: { day: string; start: string; end: string }[]; // Horários de trabalho
  commissionRate?: number; // Taxa de comissão (ex: 0.1 para 10%)
  color?: string; // Cor associada (ex: '#ff0000')
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// Interface para agendamentos como lidos do JSON/usados internamente
export interface Appointment {
  id: string;
  title: string; // Mantido para simplicidade, mas pode ser gerado dinamicamente
  start: string; // ISO 8601 string
  end: string;   // ISO 8601 string
  doctorId: string;
  patientId: string;
  healthPlanId?: string | null; // <-- NOVO CAMPO: ID do Plano de Saúde (opcional)
  bookingId?: string; // Adicionado para agrupar agendamentos múltiplos
  value?: number; // <- NOVO CAMPO: Valor do serviço/consulta
  status?: string; // <- NOVO CAMPO: Status (Confirmado, Cancelado, Finalizado, etc.)
  extendedProps?: { [key: string]: any }; // Adiciona extendedProps opcional
}

// Interface para os dados que FullCalendar espera
export interface CalendarEvent extends Appointment {
  // FullCalendar pode precisar de campos específicos, mas a estrutura base
  // de Appointment (com id, title, start, end) já é compatível.
  // Podemos adicionar campos extras aqui se necessário (ex: color, extendedProps)
}

// Interface para dados ao criar/editar um agendamento via formulário
export type AppointmentFormData = Omit<Appointment, 'id' | 'title'> & {
    // Se precisarmos de tipos diferentes no form (ex: Date object), definimos aqui
};

export type TransactionType = 'Receita' | 'Despesa';

export type TransactionStatus = 'Pendente' | 'Pago' | 'Recebido' | 'Atrasado' | 'Cancelado'; // Adicionado Cancelado

// Poderíamos ter um tipo mais robusto, talvez buscando de um endpoint no futuro
export type PaymentMethod =
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'PIX'
  | 'Boleto Bancário'
  | 'Transferência Bancária (TED/DOC)'
  | 'Outro';

// Interface para Categorias Financeiras (poderia vir de um JSON ou API)
export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType; // Para saber se é categoria de Receita ou Despesa
}

// Interface principal para Transações Financeiras
export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  description: string;
  categoryId: string; // ID da categoria associada
  value: number; // Usar número para cálculos
  dueDate: string; // Data de vencimento (ISO string: YYYY-MM-DD)
  paymentDate?: string | null; // Data de pagamento/recebimento (ISO string ou null)
  status: TransactionStatus;
  paymentMethod?: PaymentMethod | null; // Forma de pagamento usada
  patientId?: string | null; // Opcional: ID do Paciente associado
  doctorId?: string | null; // Opcional: ID do Médico associado
  notes?: string; // Opcional: Campo para notas adicionais
  // Poderíamos adicionar campos como 'fornecedorId', 'comprovanteUrl', etc. no futuro
  createdAt: string; // Data de criação do registro (ISO string)
  updatedAt: string; // Data da última atualização (ISO string)
}

// Poderíamos ter tipos para Fornecedores também
// export interface Supplier {
//   id: string;
//   name: string;
//   contact?: string;
//   cnpj?: string;
// } 

// --- NOVO: Interface para Plano de Saúde ---
export interface HealthPlan {
  id: string;
  name: string; // Nome da operadora/plano (obrigatório)
  registrationCode?: string; // Código ANS (opcional)
  contactPerson?: string; // Contato (opcional)
  phone?: string; // Telefone (opcional)
  email?: string; // Email (opcional)
  notes?: string; // Observações (opcional)
}
// --- Fim da Interface para Plano de Saúde --- 