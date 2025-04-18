import React from 'react';
import { Doctor } from '@/types';
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
                  Dr(a). {doctor.name}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {doctor.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button 
                  onClick={() => onEdit(doctor)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Editar Nome
                </button>
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