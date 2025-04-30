'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Patient } from '@/types/index';
import patientsData from '@/data/patients.json';
import { format } from 'date-fns';
import { UserIcon, ClipboardDocumentListIcon, PhoneIcon, EnvelopeIcon, DocumentArrowDownIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

// Reutilizar tipo ClinicalNote e chave
interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; 
  text: string;
  appointmentId?: string; 
  appointmentDate?: string; 
  isCorrectionOf?: string | null;
  correctionReason?: string;
}
const NOTES_LOCAL_STORAGE_KEY = 'clinicClinicalNotes';

interface ProntuarioPageProps {
  params: {
    patientId: string;
  };
}

export default function ProntuarioPage({ params }: ProntuarioPageProps) {
  const router = useRouter();
  const { patientId } = params;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [allPatientNotes, setAllPatientNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    // Buscar dados do paciente
    const pat = patientsData.find(p => p.id === patientId);
    
    if (pat) {
      setPatient(pat);
      // Buscar todas as notas do localStorage
      try {
        const storedNotes = localStorage.getItem(NOTES_LOCAL_STORAGE_KEY);
        if (storedNotes) {
          const allNotes: ClinicalNote[] = JSON.parse(storedNotes);
          // Filtrar notas APENAS deste paciente
          const patientNotes = allNotes
            .filter(note => note.patientId === patientId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Mais recentes primeiro
          setAllPatientNotes(patientNotes);
        } else {
          setAllPatientNotes([]); // Nenhuma nota no histórico geral
        }
      } catch (error) {
        console.error("Erro ao carregar notas do localStorage:", error);
        setAllPatientNotes([]); // Tratar erro
      }
    } else {
      // Paciente não encontrado
      console.error(`Paciente com ID ${patientId} não encontrado.`);
      setPatient(null); // Garante que paciente é null
    }
    setIsLoading(false);
  }, [patientId]);

  // Gerar PDF
  const handleGeneratePdf = () => {
    if (!patient) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = margin; // Posição vertical inicial

    // --- Cabeçalho do PDF ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Prontuário do Paciente', margin, y);
    y += 10;

    // --- Informações do Paciente ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(patient.name, margin + 25, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('ID:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(patient.id, margin + 25, y);
    let infoLine2 = [];
    if (patient.phone) infoLine2.push(`Telefone: ${patient.phone}`);
    if (patient.email) infoLine2.push(`Email: ${patient.email}`);
    if (infoLine2.length > 0) {
        y += 7;
        doc.text(infoLine2.join(' | '), margin, y);
    }
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // --- Histórico de Notas ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico Clínico', margin, y);
    y += 8;

    // Função auxiliar para adicionar texto com quebra de página
    const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, options?: any): number => {
        doc.setFontSize(options?.fontSize || 10);
        doc.setFont(options?.font || 'helvetica', options?.fontStyle || 'normal');
        doc.setTextColor(options?.textColor || 0);
        
        const lines = doc.splitTextToSize(text || '', maxWidth);
        let currentY = startY;
        lines.forEach((line: string) => {
            if (currentY > pageHeight - margin) { 
                doc.addPage();
                currentY = margin;
            }
            doc.text(line, x, currentY);
            currentY += (options?.lineSpacing || 5);
        });
        return currentY;
    }

    allPatientNotes.forEach((note, index) => {
        const isCorrection = !!note.isCorrectionOf;
        const indent = isCorrection ? 5 : 0; // Indentação para correções
        const noteMaxWidth = pageWidth - margin * 2 - indent;

        // Cabeçalho da Nota/Correção
        let headerY = y;
        if (isCorrection) {
            const originalNote = allPatientNotes.find(n => n.id === note.isCorrectionOf);
            headerY = addWrappedText(
                `[CORREÇÃO da nota ${note.isCorrectionOf?.substring(0, 8)}...]`,
                margin + indent, headerY, noteMaxWidth,
                { fontSize: 9, fontStyle: 'bold', textColor: 150 }
            );
            headerY = addWrappedText(
                `Motivo: ${note.correctionReason || 'Não informado'}`,
                margin + indent, headerY, noteMaxWidth,
                { fontSize: 9, fontStyle: 'italic', textColor: 80 }
            );
             if (originalNote) {
                 headerY = addWrappedText(
                     `Ref. nota original de: ${format(new Date(originalNote.date), 'dd/MM/yyyy HH:mm')} (Dr. ${originalNote.doctorId})`,
                     margin + indent, headerY, noteMaxWidth,
                     { fontSize: 9, textColor: 100 }
                 );
             }
             headerY = addWrappedText(
                `Correção salva em: ${format(new Date(note.date), 'dd/MM/yyyy HH:mm')} (Dr. ${note.doctorId})`,
                margin + indent, headerY, noteMaxWidth,
                { fontSize: 9, fontStyle: 'bold', textColor: 80 } 
             );
        } else {
             let originalHeader = `Salvo em: ${format(new Date(note.date), 'dd/MM/yyyy HH:mm')} (Dr. ${note.doctorId})`;
             if (note.appointmentDate) {
                 originalHeader += ` - Ref. Atend: ${format(new Date(note.appointmentDate), 'dd/MM/yyyy')}`;
             }
             headerY = addWrappedText(
                 originalHeader,
                 margin + indent, headerY, noteMaxWidth,
                 { fontSize: 9, fontStyle: 'bold', textColor: 100 }
             );
        }
        y = headerY + 1; // Menor espaço após cabeçalho

        // Texto da Nota/Correção
        y = addWrappedText(
            note.text,
            margin + indent, y, noteMaxWidth,
            { fontSize: 10 } // Fonte normal para o texto
        );

        y += 6; // Espaço após a nota (menor)
        
        // Linha divisória (exceto após a última nota)
        if (index < allPatientNotes.length - 1) {
            if (y > pageHeight - margin - 5) {
                 doc.addPage();
                 y = margin;
            } else {
                 doc.setLineWidth(0.1);
                 doc.setDrawColor(200); // Linha cinza claro
                 doc.line(margin, y, pageWidth - margin, y);
                 y += 5;
            }
        }
    });

    // --- Salvar PDF ---
    doc.save(`prontuario_${patient.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  // Renderização de Loading
  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Carregando prontuário...</div>;
  }

  // Renderização de Erro - Paciente não encontrado
  if (!patient) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-red-600">Erro ao Carregar Prontuário</h1>
        <p className="text-gray-700 mt-2">Não foi possível encontrar o paciente com ID '{patientId}'. Verifique o ID ou tente novamente.</p>
        <button 
          onClick={() => router.back()} 
          className="mt-6 inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium shadow-sm transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Voltar
        </button>
      </div>
    );
  }

  // Renderização Principal da Página
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Card de Informações do Paciente - Estilo Melhorado */} 
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex flex-wrap justify-between items-center gap-4">
             <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center">
                <UserIcon className="h-6 w-6 sm:h-7 sm:w-7 mr-2 text-indigo-600" />
                Prontuário de: {patient.name}
             </h1>
             <button 
                onClick={handleGeneratePdf}
                disabled={isLoading || !patient || allPatientNotes.length === 0}
                className="flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" 
                title="Gerar PDF do prontuário completo"
             >
                <DocumentArrowDownIcon className="h-5 w-5 mr-1.5" />
                Gerar PDF
             </button>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div className="text-gray-700">
                <span className="font-medium text-gray-900 block sm:inline">ID:</span> 
                <span className="ml-0 sm:ml-1">{patient.id}</span>
            </div>
            {patient.phone && (
                <div className="flex items-center text-gray-700">
                    <PhoneIcon className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0"/> 
                    <span className="font-medium text-gray-900 mr-1">Telefone:</span> 
                    <span className="truncate">{patient.phone}</span>
                </div>
            )}
            {patient.email && (
                <div className="flex items-center text-gray-700">
                    <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-500 flex-shrink-0"/> 
                    <span className="font-medium text-gray-900 mr-1">Email:</span> 
                    <span className="truncate">{patient.email}</span>
                </div>
            )}
        </div>
      </div>

      {/* Card do Histórico de Notas - Estilo Melhorado */} 
      <div className="bg-white shadow-md rounded-lg overflow-hidden"> 
         <div className="px-4 py-5 sm:px-6 border-b border-gray-200"> 
             <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-indigo-600" />
                Histórico Clínico Completo
             </h2>
         </div>
         <div className="px-4 py-5 sm:p-6"> 
             {allPatientNotes.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-md p-6 text-center min-h-[100px] flex flex-col items-center justify-center bg-gray-50">
                   <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400 mb-3" />
                   <p className="text-gray-500 italic text-center">Nenhuma anotação encontrada no histórico deste paciente.</p>
                </div>
             ) : (
                <ul className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                  {allPatientNotes.map(note => (
                    <li 
                       key={note.id} 
                       className={`
                          ${note.isCorrectionOf ? 'border-l-4 border-orange-300 pl-4 py-4 bg-orange-50/50 rounded-r-md' : 'py-4'} 
                          relative transition-colors duration-150 ease-in-out 
                          group
                       `}
                    >
                      <div className="mb-2 text-xs space-y-0.5"> 
                         {note.isCorrectionOf && (
                             <p className="font-semibold text-orange-800">
                                [CORREÇÃO da nota {note.isCorrectionOf.substring(0, 8)}...]
                             </p>
                         )}
                         {note.correctionReason && (
                            <p className="italic text-gray-600">
                               Motivo: {note.correctionReason}
                            </p>
                         )}
                         {note.appointmentDate && (
                           <p className="text-gray-500">
                             Ref. Atendimento: {format(new Date(note.appointmentDate), 'dd/MM/yyyy HH:mm')}
                           </p>
                         )}
                         <p className="font-medium text-gray-600">
                           {note.isCorrectionOf ? 'Correção salva em:' : 'Salvo em:'} {format(new Date(note.date), 'dd/MM/yyyy HH:mm')} 
                           <span className="font-normal text-gray-500 ml-1">(Dr. {note.doctorId})</span>
                         </p>
                       </div>
                       
                       <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                           {note.text}
                       </p>
                      
                       <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 group-last:hidden 
                          ${note.isCorrectionOf ? 'ml-4' : ''} "></div> 
                    </li>
                  ))}
                </ul>
             )}
         </div>
      </div>

      {/* Botão Voltar - Estilo Melhorado */} 
      <div className="mt-6 text-center sm:text-left"> 
        <button 
           onClick={() => router.back()} 
           className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
        >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> 
            Voltar
        </button>
       </div>

    </div>
  );
} 