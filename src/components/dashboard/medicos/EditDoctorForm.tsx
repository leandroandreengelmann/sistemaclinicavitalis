import React, { useState, useEffect } from 'react';
import { Doctor } from '@/types'; // Importar apenas Doctor
import toast from 'react-hot-toast';

// Definir tipo local para WorkingHour baseado na estrutura de Doctor
type WorkingHour = {
  day: string;
  start: string;
  end: string;
};

// Tipo auxiliar para Doctor com garantia de workingHours
type DoctorWithWorkingHours = Doctor & {
  workingHours?: WorkingHour[]; 
};

interface EditDoctorFormProps {
  doctor: Doctor | null; // Médico a ser editado (ou null se for novo? Por ora, edição)
  onClose: () => void;
  onSave: (updatedDoctor: Doctor) => Promise<void>; // Função para chamar a API
}

const EditDoctorForm: React.FC<EditDoctorFormProps> = ({ doctor, onClose, onSave }) => {
  // --- Estado simplificado: apenas horários --- 
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // -------------------------------------------
  
  // Inicializa apenas os horários quando o médico muda
  useEffect(() => {
    // Usar assertion para garantir que doctor tem workingHours (se existir)
    const currentDoctor = doctor as DoctorWithWorkingHours | null;
    if (currentDoctor?.workingHours) {
      setWorkingHours([...currentDoctor.workingHours.map((wh: WorkingHour) => ({...wh}))]); 
    } else {
      setWorkingHours([]); // Começa vazio se não houver horários
    }
  }, [doctor]); // Dependência apenas em doctor

  // --- Handlers apenas para Horários --- 
  const handleWorkingHoursChange = (index: number, field: keyof WorkingHour, value: string) => {
    setWorkingHours(currentHours => {
        const updatedHours = [...currentHours];
        if (updatedHours[index]) {
            updatedHours[index] = { ...updatedHours[index], [field]: value };
        }
        return updatedHours;
    });
  };

  const addWorkingHour = () => {
    const newHour: WorkingHour = { day: 'Segunda', start: '09:00', end: '17:00' };
    setWorkingHours(currentHours => [...currentHours, newHour]);
  };

  const removeWorkingHour = (index: number) => {
    setWorkingHours(currentHours => currentHours.filter((_, i) => i !== index));
  };
  // -------------------------------------

  // Handler para salvar - Usar assertion ao construir o objeto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return; 
    
    const updatedDoctor: Doctor = {
      ...(doctor as DoctorWithWorkingHours), // Assertion aqui
      workingHours: workingHours, // Define explicitamente
    } as Doctor; // Assertion final para garantir o tipo Doctor

    setIsLoading(true);
    try {
      await onSave(updatedDoctor);
      toast.success("Horários atualizados com sucesso!");
      onClose(); 
    } catch (error) {
      console.error("Erro ao salvar horários do médico:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar horários.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!doctor) return null; // Não renderiza nada se não houver médico

  return (
    // Estrutura básica do Modal (pode usar Headless UI ou similar depois)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"> {/* Max-width menor */}
        <h2 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-3">Editar Horários: {doctor.name}</h2>
        
        {/* Formulário agora contém apenas a seção de horários */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-3"> 
          {/* Seção Horários de Atendimento */} 
           <h3 className="text-base font-medium text-gray-700">Horários de Atendimento</h3>
           {workingHours.length > 0 ? (
                workingHours.map((hour, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select 
                      value={hour.day}
                      onChange={(e) => handleWorkingHoursChange(index, 'day', e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white"
                    >
                      <option>Segunda</option> <option>Terça</option> <option>Quarta</option>
                      <option>Quinta</option> <option>Sexta</option> <option>Sábado</option> <option>Domingo</option>
                    </select>
                    <input 
                      type="time" value={hour.start}
                      onChange={(e) => handleWorkingHoursChange(index, 'start', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                    <span className="text-sm text-gray-500">até</span>
                    <input 
                      type="time" value={hour.end}
                      onChange={(e) => handleWorkingHoursChange(index, 'end', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                    <button type="button" onClick={() => removeWorkingHour(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                     </button>
                  </div>
                ))
            ) : (
                <p className="text-sm text-gray-500 italic">Nenhum horário definido.</p>
            )}
           <button type="button" onClick={addWorkingHour} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Adicionar Horário</button>
        </form>

        {/* Botões de Ação do Modal */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button 
            type="button" // importante ser type="button" para não submeter o form
            onClick={onClose} 
            disabled={isLoading}
            className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 text-sm"
          >
            Cancelar
          </button>
          <button 
            type="submit" // Botão de submit agora está ligado ao form
            form="editDoctorForm" // Associa ao form pelo ID se necessário (opcional aqui)
            onClick={handleSubmit} // Chama o submit handler
            disabled={isLoading}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Salvando...' : 'Salvar Horários'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditDoctorForm; 