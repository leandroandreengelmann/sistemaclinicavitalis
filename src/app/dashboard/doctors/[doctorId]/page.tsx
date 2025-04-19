'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DoctorForm from '@/components/dashboard/doctors/DoctorForm';
import { Doctor } from '@/types/index';
// import doctorsData from '@/data/doctors.json'; // Não usar mais diretamente
import { useDoctors } from '@/context/DoctorsContext'; // Usar o contexto
import toast from 'react-hot-toast';

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { getDoctorById, updateDoctor, deleteDoctor, isLoading: doctorsLoading } = useDoctors(); // Pegar funções do contexto
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  // const [isLoading, setIsLoading] = useState(true); // Usar isLoading do contexto

  const doctorId = params.doctorId as string; // <-- Changed from params.id

  // Buscar dados do médico usando o contexto
  useEffect(() => {
    if (doctorId && !doctorsLoading) { // Esperar contexto carregar
      const foundDoctor = getDoctorById(doctorId);
      if (foundDoctor) {
        setDoctor(foundDoctor);
      } else {
        console.error('Médico não encontrado no contexto!');
        toast.error('Médico não encontrado.');
        router.replace('/dashboard/doctors'); // Usar replace para não deixar no histórico
      }
      // setIsLoading(false); // Não precisa mais de estado local de loading
    }
  }, [doctorId, getDoctorById, doctorsLoading, router]); // Adicionar dependências

  // Salvar usando a função do contexto
  // const handleSaveDoctor = (formData: Omit<Doctor, 'id'>) => {
  //   if (!doctor) return;
  //   try {
  //     updateDoctor(doctor.id, formData); // Chamar update do contexto
  //     // Atualiza estado local para UI reagir imediatamente
  //     setDoctor(prev => prev ? { ...prev, ...formData } : null); 
  //     toast.success("Alterações salvas com sucesso!");
  //     setIsFormOpen(false);
  //   } catch (error) {
  //     console.error("Erro ao atualizar médico:", error);
  //     toast.error("Falha ao salvar alterações.");
  //   }
  // };

  // Excluir usando a função do contexto
  const handleDeleteClick = () => {
    if (!doctor) return;

    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2 text-center">Tem certeza que deseja excluir <br/><b>{doctor.name}</b>?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                deleteDoctor(doctor.id); // Mantém doctor.id aqui, pois é o ID do objeto
                toast.success(`Médico ${doctor.name} excluído com sucesso!`, { id: t.id });
                router.push('/dashboard/doctors');
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

  // Usar isLoading do contexto
  if (doctorsLoading || !doctor) { // Mostrar loading enquanto contexto carrega OU médico não foi encontrado ainda
    return <DashboardLayout><div>Carregando perfil do médico...</div></DashboardLayout>;
  }

  // Helper para formatar a comissão
  const formatCommission = (rate?: number) => {
    if (rate === undefined || rate === null) return 'N/A';
    return `${(rate * 100).toFixed(0)}%`;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-md">
        {/* Botões de Ação no Topo */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => router.back()}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <div className="space-x-2">
             {/* Link para a página de edição */}
            <button 
              onClick={() => router.push(`/dashboard/doctors/${doctorId}/edit`)} // <-- Changed to use doctorId
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
               Editar Perfil
            </button>
            <button 
              onClick={handleDeleteClick} 
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm"
            >
              Excluir Médico
            </button>
          </div>
        </div>
        
        {/* Header do Perfil */}
        <div className="flex items-center mb-6 border-b pb-4">
          <span 
            className="h-10 w-10 rounded-full mr-4 flex items-center justify-center text-white text-lg font-semibold"
            style={{ backgroundColor: doctor.color || '#6b7280' }} // Cor do médico ou cinza padrão
          >
            {doctor.name.charAt(0).toUpperCase()} {/* Inicial */}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{doctor.name}</h1>
            {doctor.specialties && doctor.specialties.length > 0 && (
              <p className="text-sm text-gray-500">{doctor.specialties.join(', ')}</p>
            )}
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horários de Trabalho */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Horários de Atendimento</h2>
            {doctor.workingHours && doctor.workingHours.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-600">
                {doctor.workingHours.map((slot, index) => (
                  <li key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{slot.day}</span>
                    <span>{slot.start} - {slot.end}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum horário definido.</p>
            )}
          </div>

          {/* Outras Informações */}
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-semibold text-gray-700">Taxa de Comissão</h3>
              <p className="text-sm text-gray-600">{formatCommission(doctor.commissionRate)}</p>
            </div>
             <div>
              <h3 className="text-md font-semibold text-gray-700">Cor Associada</h3>
              <div className="flex items-center">
                <span 
                  className="h-5 w-5 rounded-sm mr-2 border"
                  style={{ backgroundColor: doctor.color || 'transparent' }}
                ></span>
                <span className="text-sm text-gray-600 uppercase">{doctor.color || 'N/A'}</span>
              </div>
            </div>
            {/* Adicionar mais informações aqui se necessário */}
          </div>
        </div>
      </div>

      {/* Remover Modal/Formulário de Edição daqui */}
      {/* { isFormOpen && doctor && ( ... ) } */}
    </DashboardLayout>
  );
}
