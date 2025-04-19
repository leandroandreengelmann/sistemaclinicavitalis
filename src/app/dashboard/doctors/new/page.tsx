'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorForm from '@/components/dashboard/doctors/DoctorForm';
import { useDoctors } from '@/context/DoctorsContext';
import { Doctor } from '@/types/index';
import toast from 'react-hot-toast';

export default function NewDoctorPage() {
  const router = useRouter();
  const { addDoctor } = useDoctors();

  const handleSave = (formData: Omit<Doctor, 'id'>) => {
    try {
      addDoctor(formData);
      toast.success(`Médico ${formData.name} adicionado com sucesso!`);
      router.push('/dashboard/doctors'); // Volta para a lista após salvar
    } catch (error) {
      console.error("Erro ao adicionar médico:", error);
      toast.error("Ocorreu um erro ao adicionar o médico.");
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/doctors'); // Volta para a lista
  };

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
          {/* Renderiza o formulário diretamente, sem modal */}
          {/* Passamos null como initialData para indicar que é adição */}
          {/* Envolvemos em um container se quisermos limitar a largura */}
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <h1 className="text-2xl font-semibold mb-6 border-b pb-3">Adicionar Novo Médico</h1>
             <DoctorForm 
                initialData={null} 
                onSave={handleSave} 
                onClose={handleCancel} // onClose agora funciona como Cancelar/Voltar
            />
           </div>
       </div>
    </DashboardLayout>
  );
} 