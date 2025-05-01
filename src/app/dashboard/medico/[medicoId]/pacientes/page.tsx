'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppointments } from '@/context/AppointmentsContext';
import { Appointment, Patient } from '@/types/index';
import patientsData from '@/data/patients.json';
import { UserGroupIcon } from '@heroicons/react/24/outline'; // Ícone para a página
import { useParams } from 'next/navigation';

interface MedicoPacientesPageProps {
  params: Promise<{
    medicoId: string;
  }>;
}

export default function MedicoPacientesPage({ params }: MedicoPacientesPageProps) {
  const paramsObj = useParams();
  const medicoId = paramsObj.medicoId as string;
  const { appointments } = useAppointments();
  const [attendedPatients, setAttendedPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Filtrar agendamentos deste médico
    const doctorAppointments = appointments.filter(app => app.doctorId === medicoId);
    
    // Extrair IDs únicos de pacientes usando Array.from
    const attendedPatientIds = Array.from(new Set(doctorAppointments.map(app => app.patientId)));
    
    // Buscar dados dos pacientes (filtrando nulos caso um ID não seja encontrado)
    const attendedPatientsData = attendedPatientIds
        .map(id => patientsData.find(patient => patient.id === id))
        .filter(patient => patient !== undefined) as Patient[]; // Filtra e garante o tipo
    
    // Atualizar estado com os pacientes atendidos
    setAttendedPatients(attendedPatientsData);
    setIsLoading(false);

  }, [appointments, medicoId]); // Roda quando appointments ou medicoId mudam

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-6 flex items-center">
        <UserGroupIcon className="h-7 w-7 mr-2 text-indigo-600" />
        Meus Pacientes Atendidos
      </h1>

      {isLoading ? (
        <p className="text-gray-500">Carregando pacientes...</p>
      ) : attendedPatients.length === 0 ? (
        <p className="text-gray-500">Nenhum paciente atendido por você encontrado no histórico de agendamentos.</p>
      ) : (
        <ul className="space-y-3">
          {attendedPatients.map(patient => (
            <li key={patient.id} className="p-4 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-gray-900 text-lg">{patient.name}</p>
                <p className="flex items-center text-sm text-gray-500 mt-1">
                  {/* Exemplo: Mostrar ID ou outra informação */}
                  ID: {patient.id} 
                  {patient.phone && <span className="ml-4">Tel: {patient.phone}</span>}
                </p>
              </div>
              <div className="mt-2 sm:mt-0">
                <Link 
                  href={`/dashboard/prontuario/${patient.id}`} // Rota futura
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                  title={`Ver prontuário de ${patient.name}`}
                >
                  Abrir Prontuário
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 