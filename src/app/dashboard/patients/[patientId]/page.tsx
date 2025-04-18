'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PatientAppointmentHistory from '@/components/dashboard/patients/PatientAppointmentHistory';
import { useAppointments } from '@/context/AppointmentsContext';
import { Patient, Appointment } from '@/types';
import patientsData from '@/data/patients.json';

export default function PatientDetailPage() {
  const params = useParams();
  const { appointments } = useAppointments();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const patientId = params.patientId as string; // Obter ID da URL

  useEffect(() => {
    if (patientId && appointments) {
      // Encontrar o paciente nos dados estáticos
      const foundPatient = (patientsData as Patient[]).find(p => p.id === patientId);
      setPatient(foundPatient || null);

      // Filtrar os agendamentos para este paciente
      const filteredAppointments = appointments.filter(app => app.patientId === patientId);
      setPatientAppointments(filteredAppointments);
      
      setIsLoading(false);
    }
  }, [patientId, appointments]); // Depende do ID e dos agendamentos carregados

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6"><p>Carregando detalhes do paciente...</p></div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-red-500">Paciente não encontrado.</p>
          <Link href="/dashboard/patients" className="text-indigo-600 hover:underline mt-4 inline-block">
            Voltar para a lista de pacientes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Cabeçalho com nome e link de volta */}
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Detalhes do Paciente</h1>
            <Link href="/dashboard/patients" className="text-sm text-indigo-600 hover:underline">
                &larr; Voltar para Lista
            </Link>
        </div>

        {/* Informações do Paciente */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">{patient.name}</h2>
            <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium text-gray-700">ID:</span> {patient.id}</p>
                <p><span className="font-medium text-gray-700">Email:</span> {patient.email || "Não informado"}</p>
                <p><span className="font-medium text-gray-700">Telefone:</span> {patient.phone || "Não informado"}</p>
            </div>
        </div>

        {/* Histórico de Agendamentos (Componente a ser criado) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Histórico de Agendamentos</h2>
            <PatientAppointmentHistory appointments={patientAppointments} />
        </div>

      </div>
    </DashboardLayout>
  );
} 