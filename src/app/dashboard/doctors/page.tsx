'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorList from '@/components/dashboard/doctors/DoctorList';
import EditDoctorForm from '@/components/dashboard/medicos/EditDoctorForm';
import { Doctor } from '@/types/index';
import { useDoctors } from '@/context/DoctorsContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ManageDoctorsPage() {
  const { doctors, deleteDoctor, isLoading: doctorsLoading, updateDoctor } = useDoctors();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleSaveDoctor = async (updatedDoctorData: Doctor) => {
    try {
      const { id, ...updates } = updatedDoctorData;
      if (!id) {
          throw new Error("ID do médico ausente nos dados atualizados.");
      }
      updateDoctor(id, updates);
    } catch (error) {
      console.error("Erro ao chamar updateDoctor do contexto:", error);
      throw error; 
    }
  };

  const handleDeleteDoctor = (doctorId: string) => {
    const doctorToDelete = doctors.find(d => d.id === doctorId);
    if (!doctorToDelete) return;

    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir <br/><b>{doctorToDelete.name}</b>?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                deleteDoctor(doctorId);
                toast.success(`Médico ${doctorToDelete.name} excluído com sucesso!`, { id: t.id });
              } catch (error) {
                console.error("Erro ao excluir médico:", error);
                toast.error("Falha ao excluir médico.", { id: t.id });
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </span>
    ), { duration: 8000 });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Gestão de Médicos</h1>
          <Link 
            href="/dashboard/doctors/new" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Adicionar Novo Médico
          </Link>
        </div>

        {doctorsLoading && <p>Carregando médicos...</p>}

        {!doctorsLoading && (
          <DoctorList 
            doctors={doctors} 
            onEdit={handleEdit}
            onDelete={handleDeleteDoctor}
          />
        )}

        {isModalOpen && editingDoctor && (
          <EditDoctorForm
            doctor={editingDoctor}
            onClose={handleCloseModal}
            onSave={handleSaveDoctor}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 