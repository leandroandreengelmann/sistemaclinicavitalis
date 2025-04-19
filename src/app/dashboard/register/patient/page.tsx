'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PatientForm from '@/components/dashboard/patients/PatientForm'; // Importa o formulário existente
import { usePatients } from '@/context/PatientsContext'; // Importa o novo contexto
import { Patient } from '@/types/index';
import toast from 'react-hot-toast';

export default function RegisterPatientPage() {
  const router = useRouter();
  const { addPatient } = usePatients(); // Usa a função do contexto

  const handleSave = (formData: Omit<Patient, 'id'>) => {
    try {
      addPatient(formData);
      toast.success(`Paciente ${formData.name} cadastrado com sucesso!`);
      router.push('/dashboard/patients'); // Pode redirecionar para a lista de pacientes ou dashboard
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      toast.error("Ocorreu um erro ao cadastrar o paciente.");
    }
  };

  const handleCancel = () => {
    router.push('/dashboard'); // Volta para o dashboard principal
  };

  return (
    <DashboardLayout>
       <div className="p-4 md:p-6">
          {/* Container para limitar a largura do formulário */}
           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-2xl font-semibold">Cadastrar Novo Paciente</h1>
                 <button 
                    onClick={handleCancel}
                    className="text-sm text-gray-600 hover:text-gray-800"
                 >
                    &larr; Voltar para Dashboard
                 </button>
             </div>
             {/* Renderiza o formulário para adição (initialData=null) */}
             <PatientForm 
                initialData={null} 
                onSave={handleSave} 
                onClose={handleCancel}
            />
           </div>
       </div>
    </DashboardLayout>
  );
} 