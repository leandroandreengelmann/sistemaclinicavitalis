'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorForm from '@/components/dashboard/doctors/DoctorForm';
import { useDoctors } from '@/context/DoctorsContext';
import { Doctor } from '@/types/index';
import toast from 'react-hot-toast';

export default function RegisterDoctorPage() {
  const router = useRouter();
  const { addDoctor } = useDoctors();

  const handleSave = (formData: Omit<Doctor, 'id'>) => {
    try {
      addDoctor(formData);
      toast.success(`Médico ${formData.name} cadastrado com sucesso!`);
      router.push('/dashboard/doctors');
    } catch (error) {
      console.error("Erro ao cadastrar médico:", error);
      toast.error("Ocorreu um erro ao cadastrar o médico.");
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl font-semibold">Cadastrar Novo Médico</h1>
                <button 
                    onClick={handleCancel}
                    className="text-sm text-gray-600 hover:text-gray-800"
                >
                    &larr; Voltar para Dashboard
                </button>
             </div>
             <DoctorForm 
                initialData={null} 
                onSave={handleSave} 
                onClose={handleCancel}
            />
           </div>
       </div>
    </DashboardLayout>
  );
} 