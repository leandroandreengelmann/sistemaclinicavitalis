export interface Doctor {
  id: string;
  name: string;
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
  bookingId?: string; // Adicionado para agrupar agendamentos múltiplos
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