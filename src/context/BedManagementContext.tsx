'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
// Comentar importações de @/types novamente
// import { Room, Bed, Hospitalization, BedStatus } from '@/types'; 
// import type { BedStatusHistoryEntry } from '@/types'; 
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// --- Readicionar Definições de Tipo Locais (Workaround) ---
// Copiadas de @/types/index.ts

// Enum para os status possíveis de um leito
export enum BedStatus {
  LIVRE = 'Livre',
  OCUPADO = 'Ocupado',
  HIGIENIZANDO = 'Higienizando',
  DESATIVADO = 'Desativado',
}

// Interface para o histórico de status de um leito
export interface BedStatusHistoryEntry {
  status: BedStatus;
  timestamp: Date;
  notes?: string;
}

// Interface para Quarto
export interface Room {
  id: string;
  number: string;
  floor?: string;
  type?: string;
  notes?: string;
}

// Interface principal para um Leito
export interface Bed {
  id: string;
  number: string;
  roomId: string; 
  status: BedStatus;
  type?: string;
  location?: string;
  patientId?: string | null;
  admissionDate?: Date | null;
  statusHistory: BedStatusHistoryEntry[];
  notes?: string;
}

// Interface para Internação
export interface Hospitalization {
  id: string;
  patientId: string;
  bedId: string;
  admissionDate: string; 
  dischargeDate?: string | null;
  notes?: string;
}

// --- NOVAS INTERFACES PARA PRESCRIÇÃO --- 
export interface PrescriptionItem {
  id: string; // ID único para o item da prescrição
  medicationName: string; // Nome do medicamento
  dosage: string; // Ex: "100mg", "5ml"
  route: string; // Via de administração: Ex: "Oral", "IV", "IM"
  frequency: string; // Frequência: Ex: "8/8h", "1x ao dia", "Se necessário"
  duration?: string; // Duração: Ex: "7 dias", "Contínuo"
  notes?: string; // Observações adicionais
}

export interface Prescription {
  id: string; // ID único da prescrição
  bedId: string; // Leito ao qual a prescrição está associada (indiretamente ao paciente)
  // Poderíamos ter patientId ou hospitalizationId aqui também se tivéssemos internações formais
  prescriberName?: string; // Nome do médico/prescritor (simplificado)
  prescriptionDate: Date; // Data e hora da prescrição
  items: PrescriptionItem[]; // Array com os itens da prescrição
  notes?: string; // Observações gerais da prescrição
}
// --- FIM NOVAS INTERFACES --- 

// Chaves localStorage
const ROOMS_STORAGE_KEY = 'clinicRooms';
const BEDS_STORAGE_KEY = 'clinicBeds';
const HOSPITALIZATIONS_STORAGE_KEY = 'clinicHospitalizations';
const PRESCRIPTIONS_STORAGE_KEY = 'clinicPrescriptions'; // Nova chave

// Dados mockados (usando tipos locais)
// Remover @ts-ignore da definição
const mockBeds: Bed[] = [
  { id: '1', roomId: 'r1', number: '101A', status: BedStatus.LIVRE, type: 'Apartamento', location: 'Ala Sul', statusHistory: [{ status: BedStatus.LIVRE, timestamp: new Date() }] },
  { id: '2', roomId: 'r2', number: '102B', status: BedStatus.OCUPADO, type: 'Apartamento', location: 'Ala Sul', patientId: 'p1', admissionDate: new Date(Date.now() - 86400000), statusHistory: [{ status: BedStatus.OCUPADO, timestamp: new Date() }] },
  { id: '3', roomId: 'r3', number: '201', status: BedStatus.HIGIENIZANDO, type: 'Enfermaria', location: 'Ala Norte', statusHistory: [{ status: BedStatus.HIGIENIZANDO, timestamp: new Date() }] },
  { id: '4', roomId: 'r3', number: '202', status: BedStatus.LIVRE, type: 'Enfermaria', location: 'Ala Norte', statusHistory: [{ status: BedStatus.LIVRE, timestamp: new Date() }] },
];
const mockRooms: Room[] = [ // Manter mocks de Room
  { id: 'r1', number: '101', floor: '1º', type: 'Apartamento' },
  { id: 'r2', number: '102', floor: '1º', type: 'Apartamento' },
  { id: 'r3', number: '201', floor: '2º', type: 'Enfermaria' },
];

// Interface do Contexto (Adicionar Prescrições)
interface BedManagementContextType { 
  rooms: Room[];
  beds: Bed[];
  hospitalizations: Hospitalization[];
  prescriptions: Prescription[]; // <<== Adicionar estado de prescrições
  isLoading: boolean;
  // Funções CRUD para Rooms
  addRoom: (roomData: Omit<Room, 'id'>) => Promise<Room | null>;
  updateRoom: (roomId: string, updates: Partial<Omit<Room, 'id'> >) => void;
  deleteRoom: (roomId: string) => void;
  // Funções CRUD para Beds
  addBed: (bedData: Omit<Bed, 'id' | 'status' | 'statusHistory' | 'patientId' | 'admissionDate'>) => Promise<Bed | null>;
  updateBed: (bedId: string, updates: Partial<Bed>) => Promise<boolean>;
  deleteBed: (bedId: string) => Promise<void>;
  // Funções de Internação/Alta
  admitPatient: (admissionData: Omit<Hospitalization, 'id' | 'admissionDate' | 'dischargeDate'>) => void;
  dischargePatient: (hospitalizationId: string, dischargeDate?: string) => void;
  // Funções de Consulta
  fetchData: () => Promise<void>;
  getRoomById: (roomId: string) => Room | undefined;
  getBedById: (bedId: string) => Bed | undefined;
  getBedsByRoomId: (roomId: string) => Bed[];
  getActiveHospitalizationByBedId: (bedId: string) => Hospitalization | undefined;
  getPatientHospitalizations: (patientId: string) => Hospitalization[];
  // Funções de Prescrição
  addPrescription: (prescriptionData: Omit<Prescription, 'id'>) => Promise<Prescription | null>;
  getPrescriptionsByBedId: (bedId: string) => Prescription[];
}

const BedManagementContext = createContext<BedManagementContextType | undefined>(undefined);

interface BedManagementProviderProps {
  children: ReactNode;
}

export const BedManagementProvider: React.FC<BedManagementProviderProps> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]); // <<== Adicionar estado
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage (incluir prescrições)
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedRooms = localStorage.getItem(ROOMS_STORAGE_KEY);
      const storedBeds = localStorage.getItem(BEDS_STORAGE_KEY);
      const storedHospitalizations = localStorage.getItem(HOSPITALIZATIONS_STORAGE_KEY);
      const storedPrescriptions = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY); // <<== Carregar prescrições
      
      setRooms(storedRooms ? JSON.parse(storedRooms) : mockRooms);
      setBeds(storedBeds ? JSON.parse(storedBeds) : mockBeds);
      setHospitalizations(storedHospitalizations ? JSON.parse(storedHospitalizations) : []);
      setPrescriptions(storedPrescriptions ? JSON.parse(storedPrescriptions) : []); // <<== Definir prescrições
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados.");
      // Resetar para mocks/vazio em caso de erro
      setRooms(mockRooms);
      setBeds(mockBeds);
      setHospitalizations([]);
      setPrescriptions([]);
    }
    setIsLoading(false);
  }, []);

  // Salvar dados no localStorage quando mudarem (incluir prescrições)
  useEffect(() => { if (!isLoading) localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms)); }, [rooms, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(BEDS_STORAGE_KEY, JSON.stringify(beds)); }, [beds, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(HOSPITALIZATIONS_STORAGE_KEY, JSON.stringify(hospitalizations)); }, [hospitalizations, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(prescriptions)); }, [prescriptions, isLoading]); // <<== Salvar prescrições

  // --- Implementações das Funções (Remover @ts-ignore internos) --- 

  const fetchData = useCallback(async () => {
    // No contexto atual com localStorage, essa função pode não fazer nada
    // ou forçar recarregamento do localStorage (mas o useEffect já faz)
    // Poderia ser usada para buscar de API no futuro.
    console.log("fetchData chamada (atualmente carrega do localStorage)");
  }, []);

  const addRoom = useCallback(async (newRoomData: Omit<Room, 'id'>): Promise<Room | null> => {
    // Validação (pode ser melhorada)
    if (rooms.some(room => room.number.toLowerCase() === newRoomData.number.toLowerCase())) {
      toast.error(`Quarto número "${newRoomData.number}" já existe.`);
      return null; // Retorna null em caso de falha
    }
    
    const newRoom: Room = {
      ...newRoomData,
      id: uuidv4(), // Usar uuid
    };
    setRooms((prevRooms) => [...prevRooms, newRoom].sort((a, b) => a.number.localeCompare(b.number)));
    toast.success(`Quarto ${newRoom.number} adicionado.`);
    return newRoom; // Retorna o quarto adicionado
  }, [rooms]);

  const addBed = useCallback(async (newBedData: Omit<Bed, 'id' | 'status' | 'statusHistory' | 'patientId' | 'admissionDate'>): Promise<Bed | null> => {
    // Validação: verificar se o quarto existe
    if (!rooms.some(room => room.id === newBedData.roomId)){
        toast.error("Quarto selecionado não encontrado.");
        return null;
    }
    // Validação: número único dentro do quarto (já existia no modal, mas bom ter aqui tbm)
    const roomBeds = beds.filter(bed => bed.roomId === newBedData.roomId);
    if(roomBeds.some(bed => bed.number.toLowerCase() === newBedData.number.toLowerCase())){
        toast.error(`Já existe um leito "${newBedData.number}" neste quarto.`);
        return null;
    }
    
    const newBed: Bed = {
      ...newBedData,
      id: uuidv4(),
      status: BedStatus.LIVRE,
      statusHistory: [{ status: BedStatus.LIVRE, timestamp: new Date() }],
    };
    setBeds((prevBeds) => [...prevBeds, newBed].sort((a,b) => a.number.localeCompare(b.number)));
    toast.success(`Leito ${newBed.number} adicionado.`);
    return newBed;
  }, [beds, rooms]);

  const updateBed = useCallback(async (bedId: string, updates: Partial<Bed>): Promise<boolean> => {
    let found = false;
    setBeds((prevBeds) =>
      prevBeds.map((bed) => {
        if (bed.id === bedId) {
          found = true;
          const newStatus = updates.status ?? bed.status;
          const currentStatus = bed.status;
          const statusHistory = [...(bed.statusHistory || [])];

          if (newStatus !== currentStatus) {
            statusHistory.push({ status: newStatus, timestamp: new Date() });
          }

          const finalUpdatedBed: Bed = {
            ...bed,
            ...updates,
            status: newStatus,
            patientId: newStatus === BedStatus.OCUPADO ? (updates.patientId !== undefined ? updates.patientId : bed.patientId) : null,
            admissionDate: newStatus === BedStatus.OCUPADO ? (updates.admissionDate !== undefined ? updates.admissionDate : bed.admissionDate) : null,
            statusHistory: statusHistory,
          };
          return finalUpdatedBed;
        }
        return bed;
      })
    );
    if (found) {
        toast.success("Leito atualizado.");
    } else {
        toast.error("Leito não encontrado para atualização.");
    }
    return found;
  }, [beds]);

  const removeBed = useCallback(async (bedId: string): Promise<void> => {
    const bedToRemove = beds.find(b => b.id === bedId);
    if (bedToRemove?.status === BedStatus.OCUPADO) {
        toast.error("Não é possível remover um leito ocupado.");
        return;
    }
    setBeds((prevBeds) => prevBeds.filter((bed) => bed.id !== bedId));
    toast.success("Leito removido.");
  }, [beds]);

  // --- Funções Placeholder (Manter/Implementar depois) ---
  const updateRoom = (roomId: string, updates: Partial<Omit<Room, 'id'> >) => { console.warn("updateRoom não implementada"); toast.error("Função Editar Quarto não implementada.") };
  const deleteRoom = (roomId: string) => {
      console.warn("deleteRoom chamada com ID:", roomId);
       // Validação (já feita no handler da página, mas pode repetir)
      const bedsInRoom = beds.filter(b => b.roomId === roomId);
      if (bedsInRoom.length > 0) {
          toast.error("Erro interno: Tentativa de deletar quarto com leitos.");
          return;
      }
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      toast.success("Quarto deletado com sucesso.");
  };
  const admitPatient = (admissionData: Omit<Hospitalization, 'id' | 'admissionDate' | 'dischargeDate'>) => { console.warn("admitPatient não implementada"); toast.error("Função Internar Paciente não implementada.") };
  const dischargePatient = (hospitalizationId: string, dischargeDate?: string) => { console.warn("dischargePatient não implementada"); toast.error("Função Dar Alta não implementada.") };

  // --- Funções de Consulta (usando tipos locais) ---
  const getRoomById = useCallback((roomId: string) => rooms.find(r => r.id === roomId), [rooms]);
  const getBedById = useCallback((bedId: string) => beds.find(b => b.id === bedId), [beds]);
  const getBedsByRoomId = useCallback((roomId: string) => beds.filter(b => b.roomId === roomId), [beds]);
  const getActiveHospitalizationByBedId = useCallback((bedId: string) => {
    return hospitalizations.find(h => h.bedId === bedId && !h.dischargeDate);
  }, [hospitalizations]);
  const getPatientHospitalizations = useCallback((patientId: string) => {
    return hospitalizations.filter(h => h.patientId === patientId).sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
  }, [hospitalizations]);

  // --- NOVAS FUNÇÕES PARA PRESCRIÇÃO --- 
  const addPrescription = useCallback(async (prescriptionData: Omit<Prescription, 'id'>): Promise<Prescription | null> => {
    // Validação básica (poderia verificar se o bedId existe, etc.)
    if (!prescriptionData.bedId || !prescriptionData.items || prescriptionData.items.length === 0) {
        toast.error("Dados da prescrição inválidos.");
        return null;
    }
    
    const newPrescription: Prescription = {
      ...prescriptionData,
      id: uuidv4(), // Gerar ID para a prescrição
      // Garantir que cada item também tenha um ID único
      items: prescriptionData.items.map(item => ({ ...item, id: uuidv4() })) 
    };

    setPrescriptions((prevPrescriptions) => [...prevPrescriptions, newPrescription].sort((a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime()));
    toast.success("Prescrição adicionada com sucesso.");
    return newPrescription;
  }, []); // Adicionar dependências se houver (nenhuma por enquanto)

  const getPrescriptionsByBedId = useCallback((bedId: string): Prescription[] => {
      return prescriptions.filter(p => p.bedId === bedId).sort((a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime());
  }, [prescriptions]);
  // --- FIM NOVAS FUNÇÕES --- 

  // --- Valor do Contexto (Adicionar Prescrições) ---
  const contextValue = { 
      rooms,
      beds,
      hospitalizations,
      prescriptions, // <<== Expor prescrições
      isLoading,
      fetchData, 
      addRoom, 
      updateRoom, // Passar placeholder real
      deleteRoom, // Passar a função implementada
      addBed, 
      updateBed, 
      deleteBed: removeBed, // Passar a função implementada
      admitPatient, // Passar placeholder real
      dischargePatient, // Passar placeholder real
      getRoomById,
      getBedById,
      getBedsByRoomId,
      getActiveHospitalizationByBedId,
      getPatientHospitalizations,
      addPrescription, // <<== Expor função
      getPrescriptionsByBedId, // <<== Expor função
    };

  return (
    <BedManagementContext.Provider value={contextValue}>
      {!isLoading && children} // Renderiza children apenas quando não está carregando
    </BedManagementContext.Provider>
  );
};

export const useBedManagement = (): BedManagementContextType => {
  const context = useContext(BedManagementContext);
  if (!context) {
    throw new Error('useBedManagement must be used within a BedManagementProvider');
  }
  return context;
}; 