'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorForm from '@/components/dashboard/doctors/DoctorForm';
import { useDoctors } from '@/context/DoctorsContext';
import { Doctor } from '@/types/index';
import toast from 'react-hot-toast';

export default function EditDoctorPage() {
  const router = useRouter();
  const params = useParams();
  const { getDoctorById, updateDoctor, isLoading } = useDoctors();
  
  const doctorId = params.doctorId as string; // <-- Changed from params.id
  const [initialData, setInitialData] = useState<Doctor | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (doctorId && !isLoading) {
      const doctor = getDoctorById(doctorId);
      if (doctor) {
        setInitialData(doctor);
      } else {
        setNotFound(true);
        toast.error("Médico não encontrado para edição.");
        // router.replace('/dashboard/doctors'); // Ou mostrar mensagem
      }
    }
  }, [doctorId, isLoading, getDoctorById, router]);

  const handleSave = (formData: Omit<Doctor, 'id'>) => {
    if (!initialData) return; // Não deveria acontecer se chegou aqui
    try {
      updateDoctor(initialData.id, formData); // Mantém initialData.id aqui, pois é o ID do objeto
      toast.success(`Médico ${formData.name} atualizado com sucesso!`);
      router.push(`/dashboard/doctors/${initialData.id}`); // Volta para o perfil após salvar (usando o ID do objeto)
    } catch (error) {
      console.error("Erro ao atualizar médico:", error);
      toast.error("Ocorreu um erro ao atualizar o médico.");
    }
  };

  const handleCancel = () => {
    if (initialData) {
        router.push(`/dashboard/doctors/${initialData.id}`); // Volta para o perfil (usando o ID do objeto)
    } else {
        router.push('/dashboard/doctors'); // Volta para a lista se não encontrou
    }
  };

  if (isLoading || !initialData && !notFound) {
    return <DashboardLayout><div>Carregando dados para edição...</div></DashboardLayout>;
  }

  if (notFound) {
     return <DashboardLayout><div>Médico não encontrado. <button onClick={handleCancel} className="text-indigo-600 hover:underline">Voltar</button></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <h1 className="text-2xl font-semibold mb-6 border-b pb-3">Editar Médico</h1>
             {/* Renderiza o formulário com dados iniciais */}
             <DoctorForm 
                initialData={initialData} 
                onSave={handleSave} 
                onClose={handleCancel}
            />
           </div>
       </div>
    </DashboardLayout>
  );
} 