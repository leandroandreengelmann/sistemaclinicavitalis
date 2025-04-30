import React from 'react';
import { Doctor } from '@/types/index';
import Link from 'next/link';

interface DoctorListProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
}

const DoctorList: React.FC<DoctorListProps> = ({ doctors, onEdit, onDelete }) => {
  if (!doctors || doctors.length === 0) {
    return <p className="text-center text-gray-500">Nenhum médico encontrado.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Especialidades
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {doctors.map((doctor) => (
            <tr key={doctor.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <Link href={`/dashboard/doctors/${doctor.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                  {doctor.name}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doctor.specialties && doctor.specialties.length > 0 
                  ? doctor.specialties.join(', ') 
                  : <span className="italic text-gray-400">N/A</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span 
                  className="inline-block h-4 w-4 rounded-sm border border-gray-300"
                  style={{ backgroundColor: doctor.color || 'transparent' }}
                  title={doctor.color || 'Sem cor'}
                ></span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doctor.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button 
                  onClick={() => onEdit(doctor)}
                  className="text-indigo-600 hover:text-indigo-900 font-medium"
                  title="Editar horários e dados do médico"
                >
                  Editar
                </button>
                <Link 
                  href={`/dashboard/medico/${doctor.id}`} 
                  className="text-green-600 hover:text-green-900"
                  title="Ver painel individual do médico"
                >
                  Painel
                </Link>
                <button 
                  onClick={() => onDelete(doctor.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorList; 