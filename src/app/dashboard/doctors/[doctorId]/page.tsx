'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorAppointmentHistory from '@/components/dashboard/doctors/DoctorAppointmentHistory';
import { useAppointments } from '@/context/AppointmentsContext';
import { Doctor, Appointment } from '@/types';
import doctorsData from '@/data/doctors.json';

export default function DoctorDetailPage() {
  const params = useParams();
  const { appointments } = useAppointments();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const doctorId = params.doctorId as string; // Obter ID da URL

  useEffect(() => {
    if (doctorId && appointments) {
      // Encontrar o médico nos dados estáticos
      const foundDoctor = (doctorsData as Doctor[]).find(d => d.id === doctorId);
      setDoctor(foundDoctor || null);

      // Filtrar os agendamentos para este médico
      const filteredAppointments = appointments.filter(app => app.doctorId === doctorId);
      setDoctorAppointments(filteredAppointments);
      
      setIsLoading(false);
    }
  }, [doctorId, appointments]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6"><p>Carregando detalhes do médico...</p></div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-red-500">Médico não encontrado.</p>
          <Link href="/dashboard/doctors" className="text-indigo-600 hover:underline mt-4 inline-block">
            Voltar para a lista de médicos
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
            <h1 className="text-2xl font-semibold">Detalhes do Médico</h1>
            <Link href="/dashboard/doctors" className="text-sm text-indigo-600 hover:underline">
                &larr; Voltar para Lista
            </Link>
        </div>

        {/* Informações do Médico */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Dr(a). {doctor.name}</h2>
            <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium text-gray-700">ID:</span> {doctor.id}</p>
                {/* Adicionar mais campos se existirem no futuro (especialidade, etc) */}
            </div>
        </div>

        {/* Histórico de Agendamentos */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Histórico de Agendamentos</h2>
            <DoctorAppointmentHistory appointments={doctorAppointments} />
        </div>

      </div>
    </DashboardLayout>
  );
} 