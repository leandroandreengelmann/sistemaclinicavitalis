import React from 'react';
import { Patient } from '@/types';
import Link from 'next/link';

interface PatientListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onEdit, onDelete }) => {
  if (!patients || patients.length === 0) {
    return <p className="text-center text-gray-500">Nenhum paciente encontrado.</p>;
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
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Telefone
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <Link href={`/dashboard/patients/${patient.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                  {patient.name}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {patient.email || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {patient.phone || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button 
                  onClick={() => onEdit(patient)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Editar
                </button>
                <button 
                  onClick={() => onDelete(patient.id)}
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

export default PatientList; 