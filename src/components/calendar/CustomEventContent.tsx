import React from 'react';
import { EventContentArg } from '@fullcalendar/core'; // Tipo correto para props do eventContent

// Restaurar mapeamento de cores
const doctorColorMap: { [key: string]: { bg: string; border: string; text: string } } = {
    'doc1': { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-white' },
    'doc2': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-white' },
    'doc3': { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-white' },
    'doc4': { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white' },
    'doc5': { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-white' },
    'doc6': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-white' },
    'doc7': { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-white' },
    'doc8': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white' },
    'doc9': { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-white' },
    'doc10': { bg: 'bg-lime-500', border: 'border-lime-500', text: 'text-white' },
    'default': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white' }
};

const CustomEventContent: React.FC<EventContentArg> = ({ event, timeText }) => {
    // Restaurar lógica de cores dinâmicas
    const doctorId = event.extendedProps.doctorId || 'default';
    const colors = doctorColorMap[doctorId] || doctorColorMap['default'];
    const textColorClass = colors.text;

    // Remover ${colors.border} e talvez a classe 'border'
    const eventClasses = `fc-event-main-custom ${colors.bg} ${textColorClass} rounded-md px-1.5 py-0.5 text-xs font-medium w-full h-full overflow-hidden flex flex-col`;
    // Se quiser manter uma borda fina e neutra, poderia ser:
    // const eventClasses = `fc-event-main-custom ${colors.bg} ${textColorClass} border border-black/10 rounded-md px-1.5 py-0.5 text-xs font-medium w-full h-full overflow-hidden flex flex-col`;

    return (
        <div className={eventClasses}>
            {/* Hora (se aplicável, ex: timeGrid) */}
            {timeText && <span className="fc-event-time mr-1 font-normal opacity-90">{timeText}</span>}
            
            {/* Título do evento */}
            <span className="fc-event-title font-semibold whitespace-nowrap overflow-hidden overflow-ellipsis">{event.title}</span>
            
            {/* Poderia adicionar mais info aqui, como o patientId de extendedProps */}
            {/* <span className="text-xs opacity-80">ID Paciente: {event.extendedProps.patientId}</span> */}
        </div>
    );
};

export default CustomEventContent; 