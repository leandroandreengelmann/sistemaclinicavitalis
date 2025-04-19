import React, { useState, useEffect, FormEvent } from 'react';
import { Doctor } from '@/types/index';
import toast from 'react-hot-toast';

interface DoctorFormProps {
  initialData: Doctor | null;
  onSave: (formData: Omit<Doctor, 'id'>) => void;
  onClose: () => void;
}

const DoctorForm: React.FC<DoctorFormProps> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [color, setColor] = useState('#6b7280');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSpecialties(initialData.specialties?.join(', ') || '');
      setCommissionRate(initialData.commissionRate !== undefined ? String(initialData.commissionRate * 100) : '');
      setColor(initialData.color || '#6b7280');
    } else {
      setName('');
      setSpecialties('');
      setCommissionRate('');
      setColor('#6b7280');
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome do médico é obrigatório.');
      return;
    }

    let numericCommissionRate: number | undefined = undefined;
    if (commissionRate.trim()) {
        const rate = parseFloat(commissionRate.replace(',', '.'));
        if (isNaN(rate) || rate < 0 || rate > 100) {
            toast.error('Taxa de comissão inválida. Use um valor entre 0 e 100.');
            return;
        }
        numericCommissionRate = rate / 100;
    }

    const specialtiesArray = specialties.split(',')
                                      .map(s => s.trim())
                                      .filter(s => s !== '');

    const formData: Omit<Doctor, 'id'> = {
      name: name.trim(),
      specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
      commissionRate: numericCommissionRate,
      color: color,
      workingHours: initialData?.workingHours
    };
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6 border-b pb-3">
          {initialData ? 'Editar Médico' : 'Adicionar Novo Médico'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input 
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus={!initialData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Dr. João Silva"
            />
          </div>

          <div>
            <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-1">Especialidades</label>
            <input 
              type="text"
              id="specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Cardiologia, Clínica Geral (separadas por vírgula)"
            />
            <p className="mt-1 text-xs text-gray-500">Separe múltiplas especialidades por vírgula.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
              <input 
                type="number"
                id="commissionRate"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: 15"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                 <input 
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 p-1 border border-gray-300 rounded-md cursor-pointer"
                 />
                 <input 
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="#rrggbb"
                 />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {initialData ? 'Salvar Alterações' : 'Adicionar Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm; 