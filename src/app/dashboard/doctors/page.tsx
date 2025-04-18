'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorList from '@/components/dashboard/doctors/DoctorList';
import DoctorForm from '@/components/dashboard/doctors/DoctorForm'; 
import doctorsData from '@/data/doctors.json';
import { Doctor } from '@/types';
import toast from 'react-hot-toast';

export default function ManageDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    try {
      setDoctors(doctorsData as Doctor[]); 
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao carregar médicos:", err);
      const errorMessage = "Falha ao carregar dados dos médicos.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  }, []);

  const handleAddNewDoctor = () => {
    setEditingDoctor(null);
    setIsFormOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleDeleteDoctor = (doctorId: string) => {
    const doctorToDelete = doctors.find(d => d.id === doctorId);
    if (!doctorToDelete) return;

    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir <br/><b>Dr(a). {doctorToDelete.name}</b>?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDoctors(prevDoctors => prevDoctors.filter(d => d.id !== doctorId));
              toast.success(`Médico ${doctorToDelete.name} excluído com sucesso!`, { id: t.id });
              // TODO: Chamar API para excluir permanentemente
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
    ), { duration: 6000 });
  };

  const handleSaveDoctor = (formData: Omit<Doctor, 'id'>) => {
    try {
      if (editingDoctor) {
        setDoctors(prevDoctors => 
          prevDoctors.map(d => 
            d.id === editingDoctor.id ? { ...editingDoctor, ...formData } : d
          )
        );
        toast.success(`Médico ${formData.name} atualizado com sucesso!`);
        // TODO: Chamar API para atualizar
      } else {
        const newDoctor: Doctor = {
          id: `doc-${Math.random().toString(36).substr(2, 9)}`, // ID temporário
          ...formData,
        };
        setDoctors(prevDoctors => [...prevDoctors, newDoctor]);
        toast.success(`Médico ${newDoctor.name} adicionado com sucesso!`);
        // TODO: Chamar API para criar
      }
      setIsFormOpen(false);
      setEditingDoctor(null);
    } catch (error) {
        console.error("Erro ao salvar médico:", error);
        toast.error("Ocorreu um erro ao salvar o médico.");
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDoctor(null);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Gestão de Médicos</h1>
          <button 
            onClick={handleAddNewDoctor}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Adicionar Novo Médico
          </button>
        </div>

        {isLoading && <p>Carregando médicos...</p>}

        {!isLoading && !error && (
          <DoctorList 
            doctors={doctors} 
            onEdit={handleEditDoctor} 
            onDelete={handleDeleteDoctor} 
          />
        )}

        { isFormOpen && (
          <DoctorForm 
            initialData={editingDoctor}
            onSave={handleSaveDoctor}
            onClose={handleCloseForm}
          />
        ) }
      </div>
    </DashboardLayout>
  );
} 