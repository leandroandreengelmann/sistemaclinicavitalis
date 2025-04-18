import { Appointment } from '@/types';
import { parseISO, isBefore, isEqual, format } from 'date-fns'; // Importar format aqui também

interface SlotToCheck {
    start: string | Date;
    end: string | Date;
    doctorId: string;
    patientId: string;
}

/**
 * Verifica se um slot de agendamento proposto se sobrepõe com agendamentos existentes
 * para o mesmo médico ou paciente.
 *
 * @param proposedSlot O slot a ser verificado (start, end, doctorId, patientId).
 * @param existingAppointments Array com todos os agendamentos atuais.
 * @param updatingAppointmentId ID opcional do agendamento sendo atualizado (para excluí-lo da verificação).
 * @returns True se houver sobreposição, false caso contrário. Retorna um objeto com `overlap: boolean` e `message: string` em caso de conflito.
 */
export const checkAppointmentOverlap = (
    proposedSlot: SlotToCheck,
    existingAppointments: Appointment[],
    updatingAppointmentId?: string
): { overlap: boolean; message?: string } => {
    try {
        const proposedStart = typeof proposedSlot.start === 'string' ? parseISO(proposedSlot.start) : proposedSlot.start;
        const proposedEnd = typeof proposedSlot.end === 'string' ? parseISO(proposedSlot.end) : proposedSlot.end;

        // Validação básica: fim deve ser após início
        if (isBefore(proposedEnd, proposedStart) || isEqual(proposedEnd, proposedStart)) {
            return { overlap: true, message: "O horário final deve ser posterior ao horário inicial." };
        }

        for (const existing of existingAppointments) {
            // Pula o próprio agendamento se estiver atualizando
            if (existing.id === updatingAppointmentId) {
                continue;
            }

            const existingStart = parseISO(existing.start);
            const existingEnd = parseISO(existing.end);

            // Verifica sobreposição de tempo: (StartA < EndB) && (EndA > StartB)
            const timeOverlap = isBefore(proposedStart, existingEnd) && isBefore(existingStart, proposedEnd);

            if (timeOverlap) {
                // Verifica conflito de médico
                if (existing.doctorId === proposedSlot.doctorId) {
                    return {
                        overlap: true,
                        message: `Conflito: Médico já agendado (${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')}).` // Mensagem ajustada
                    };
                }
                // Verifica conflito de paciente
                if (existing.patientId === proposedSlot.patientId) {
                     return {
                        overlap: true,
                        message: `Conflito: Paciente já agendado (${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')}).` // Mensagem ajustada
                    };
                }
            }
        }

        return { overlap: false }; // Sem sobreposições encontradas
    } catch (error) {
        console.error("Erro durante a verificação de sobreposição:", error);
        return { overlap: true, message: "Erro ao verificar disponibilidade de horário." }; // Assume conflito em caso de erro
    }
}; 