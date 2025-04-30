'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PatientList from '@/components/dashboard/patients/PatientList';
import PatientForm from '@/components/dashboard/patients/PatientForm';
import patientsData from '@/data/patients.json';
import { Patient } from '@/types';
import toast from 'react-hot-toast';

export default function ManagePatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o modal/formulário de edição/criação
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    // Simula o carregamento dos dados
    try {
      // Em uma aplicação real, isso seria uma chamada de API
      setPatients(patientsData as Patient[]); 
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err);
      const errorMessage = "Falha ao carregar dados dos pacientes.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  }, []);

  const handleAddNewPatient = () => {
    setEditingPatient(null); // Garante que não estamos editando
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleDeletePatient = (patientId: string) => {
    const patientToDelete = patients.find(p => p.id === patientId);
    if (!patientToDelete) return; // Segurança extra

    // Usar toast para confirmação
    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir <br/><b>{patientToDelete.name}</b>?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId));
              toast.success(`Paciente ${patientToDelete.name} excluído com sucesso!`, { id: t.id });
              // TODO: Chamar API para excluir permanentemente no futuro
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
    ), {
      duration: 6000, // Manter o toast de confirmação um pouco mais
    });
  };

  const handleSavePatient = (formData: Omit<Patient, 'id'>) => {
    try {
      if (editingPatient) {
        // Atualizar
        setPatients(prevPatients => 
          prevPatients.map(p => 
            p.id === editingPatient.id ? { ...editingPatient, ...formData } : p
          )
        );
        toast.success(`Paciente ${formData.name} atualizado com sucesso!`);
        // TODO: Chamar API para atualizar
      } else {
        // Criar novo
        const newPatient: Patient = {
          id: `pat-${Math.random().toString(36).substr(2, 9)}`, // ID temporário
          ...formData,
        };
        setPatients(prevPatients => [...prevPatients, newPatient]);
        toast.success(`Paciente ${newPatient.name} adicionado com sucesso!`);
        // TODO: Chamar API para criar
      }
      setIsFormOpen(false);
      setEditingPatient(null);
    } catch (error) {
        console.error("Erro ao salvar paciente:", error);
        toast.error("Ocorreu um erro ao salvar o paciente.");
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPatient(null);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Gestão de Pacientes</h1>
          <button 
            onClick={handleAddNewPatient}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow"
          >
            Adicionar Novo Paciente
          </button>
        </div>

        {isLoading && <p className="text-gray-600 dark:text-gray-400">Carregando pacientes...</p>}
        {/* O erro já é mostrado via toast no useEffect */}
        {/* error && <p className="text-red-500">{error}</p> */}

        {!isLoading && !error && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <PatientList 
              patients={patients} 
              onEdit={handleEditPatient} 
              onDelete={handleDeletePatient} 
            />
            {patients.length === 0 && (
              <p className='text-center text-gray-500 dark:text-gray-400 mt-4'>Nenhum paciente encontrado.</p>
            )}
          </div>
        )}

        {isFormOpen && (
          <PatientForm 
            initialData={editingPatient}
            onSave={handleSavePatient}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 