import { useState, useCallback } from 'react';
// import type { Bed, BedStatusHistoryEntry } from '@/types'; // Comentar import externo
// import { BedStatus } from '@/types'; // Comentar import externo

// --- Definições de Tipo Locais para Depuração ---
// Copiado de @/types/index.ts
export enum BedStatus {
  LIVRE = 'Livre',
  OCUPADO = 'Ocupado',
  HIGIENIZANDO = 'Higienizando',
  DESATIVADO = 'Desativado',
}

export interface BedStatusHistoryEntry {
  status: BedStatus;
  timestamp: Date;
  notes?: string;
}

export interface Bed {
  id: string;
  number: string;
  status: BedStatus;
  type?: string;
  location?: string;
  patientId?: string | null;
  admissionDate?: Date | null;
  statusHistory: BedStatusHistoryEntry[];
  notes?: string;
  roomId?: string;
}
// --- Fim das Definições Locais ---

// --- NOVO: Definição Local de Room (para depuração) ---
export interface Room {
  id: string;
  number: string;
  floor?: string;
  type?: string;
  notes?: string;
}
// --- Fim Definição Local Room ---

interface UseBedManagementParams {
  initialBeds?: Bed[];
  initialRooms?: Room[]; // Adicionar rooms iniciais
}

// Dados mockados para quartos (exemplo inicial)
const mockRooms: Room[] = [
  { id: 'r1', number: '101', floor: '1º', type: 'Apartamento' },
  { id: 'r2', number: '102', floor: '1º', type: 'Apartamento' },
  { id: 'r3', number: '201', floor: '2º', type: 'Enfermaria' },
];

// Dados mockados para leitos - ADICIONAR roomId
const mockBeds: Bed[] = [
  { id: '1', roomId: 'r1', number: '101A', status: BedStatus.LIVRE, type: 'Apartamento', location: 'Ala Sul', statusHistory: [{ status: BedStatus.LIVRE, timestamp: new Date() }] },
  { id: '2', roomId: 'r2', number: '102B', status: BedStatus.OCUPADO, type: 'Apartamento', location: 'Ala Sul', patientId: 'p1', admissionDate: new Date(Date.now() - 86400000), statusHistory: [{ status: BedStatus.OCUPADO, timestamp: new Date() }] },
  { id: '3', roomId: 'r3', number: '201', status: BedStatus.HIGIENIZANDO, type: 'Enfermaria', location: 'Ala Norte', statusHistory: [{ status: BedStatus.HIGIENIZANDO, timestamp: new Date() }] },
  { id: '4', roomId: 'r3', number: '202', status: BedStatus.LIVRE, type: 'Enfermaria', location: 'Ala Norte', statusHistory: [{ status: BedStatus.LIVRE, timestamp: new Date() }] }, // Leito adicional
];

export function useBedManagement({ initialBeds = [], initialRooms = [] }: UseBedManagementParams = {}) {
  const [beds, setBeds] = useState<Bed[]>(initialBeds.length > 0 ? initialBeds : mockBeds); // Usar mocks se inicial vazio
  const [rooms, setRooms] = useState<Room[]>(initialRooms.length > 0 ? initialRooms : mockRooms); // Adicionar estado rooms
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch beds e rooms (simplificado para usar mocks)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula API
      // Garantir inicialização do histórico para beds
      const bedsWithHistory = mockBeds.map(bed => ({ ...bed, statusHistory: bed.statusHistory || [] }));
      setBeds(bedsWithHistory);
      setRooms(mockRooms); // Define os quartos mockados
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add room function
  const addRoom = useCallback(async (newRoomData: Omit<Room, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simula API
      const newRoom: Room = {
        ...newRoomData,
        id: `r${Date.now()}`, // Gera um ID simples
      };
      setRooms((prevRooms: Room[]) => [...prevRooms, newRoom]);
      return newRoom;
    } catch (err) {
      setError('Failed to add room.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add bed
  // O tipo Omit<Bed, 'id'> é mais apropriado, o hook definirá id, status inicial e history inicial
  const addBed = useCallback(async (newBedData: Omit<Bed, 'id' | 'status' | 'statusHistory'>) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simula API
      const newBed: Bed = {
        ...newBedData, // Inclui number, roomId, type?, location?, notes?, patientId?, admissionDate?
        id: String(Date.now()),
        status: BedStatus.LIVRE, // Status inicial
        statusHistory: [{ status: BedStatus.LIVRE, timestamp: new Date() }], // Histórico inicial
      };
      setBeds((prevBeds: Bed[]) => [...prevBeds, newBed]);
      return newBed;
    } catch (err) {
      setError('Failed to add bed.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update bed
  const updateBed = useCallback(async (bedId: string, updatedData: Partial<Bed>) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simula API

      setBeds((prevBeds: Bed[]) =>
        prevBeds.map((bed: Bed) => {
          if (bed.id === bedId) {
            const newStatus = updatedData.status ?? bed.status;
            const currentStatus = bed.status;
            // Copiar histórico existente ou iniciar um array vazio se não existir (embora não devesse acontecer)
            const statusHistory = [...(bed.statusHistory || [])];

            if (newStatus !== currentStatus) {
              statusHistory.push({ status: newStatus, timestamp: new Date() });
            }

            // Combina o leito antigo com os dados atualizados
            const finalUpdatedBed: Bed = {
              ...bed,
              ...updatedData, // Aplica todas as atualizações
              status: newStatus, // Garante o status correto
              // Limpa dados do paciente se não estiver ocupado
              patientId: newStatus === BedStatus.OCUPADO ? (updatedData.patientId !== undefined ? updatedData.patientId : bed.patientId) : null,
              admissionDate: newStatus === BedStatus.OCUPADO ? (updatedData.admissionDate !== undefined ? updatedData.admissionDate : bed.admissionDate) : null,
              statusHistory: statusHistory, // Aplica histórico atualizado
            };
            return finalUpdatedBed;
          }
          return bed;
        })
      );
      return true; // Sucesso
    } catch (err) {
      setError(`Failed to update bed status: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
      return false; // Falha
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove bed
  const removeBed = useCallback(async (bedId: string) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula API
      setBeds((prevBeds: Bed[]) => prevBeds.filter((bed: Bed) => bed.id !== bedId));
    } catch (err) {
      setError('Failed to remove bed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para buscar leitos por ID do quarto
  const getBedsByRoomId = useCallback((roomId: string) => {
      return beds.filter(bed => bed.roomId === roomId);
  }, [beds]);

  return {
    beds,
    rooms, // Retornar rooms
    loading,
    error,
    fetchData, // Renomear fetchBeds para fetchData
    addRoom, // Retornar addRoom
    addBed,
    updateBed,
    removeBed,
    getBedsByRoomId, // Retornar helper
  };
} 