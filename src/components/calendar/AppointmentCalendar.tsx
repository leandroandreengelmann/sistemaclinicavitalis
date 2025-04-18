'use client';

import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Plugin para visualização de mês
import timeGridPlugin from '@fullcalendar/timegrid'; // Plugin para visualizações de semana/dia
import interactionPlugin from '@fullcalendar/interaction'; // Plugin para interações (clique, seleção)
import { useAppointments } from '@/context/AppointmentsContext';
import { CalendarEvent } from '@/types'; // Usaremos nosso tipo aqui

// Opcional: Configurar locale para Português Brasil
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
// Importar tipos do FullCalendar
import { DateSelectArg, EventHoveringArg } from '@fullcalendar/core'; // Readicionar EventHoveringArg
// Remover tipos não utilizados
// import { EventClickArg, EventHoveringArg } from '@fullcalendar/core'; 
import CustomEventContent from './CustomEventContent'; 

// Interface com props de D&D, seleção e hover
interface AppointmentCalendarProps {
  onSelectSlot: (info: DateSelectArg) => void; 
  onEventDrop: (info: any) => void; 
  onEventResize: (info: any) => void; 
  onEventMouseEnter: (info: EventHoveringArg) => void; // Readicionar prop
  onEventMouseLeave: (info: EventHoveringArg) => void; // Readicionar prop
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  onSelectSlot, 
  onEventDrop, 
  onEventResize, 
  onEventMouseEnter, // Readicionar parâmetro
  onEventMouseLeave  // Readicionar parâmetro
}) => {
  const { appointments } = useAppointments();

  // DEBUG: Log para verificar os agendamentos recebidos (Manter por enquanto)
  useEffect(() => {
    console.log("Appointments recebidos no AppointmentCalendar:", appointments);
  }, [appointments]);

  // Não precisamos mais mapear para calendarEvents aqui se o formato Appointment já é compatível
  // const calendarEvents: CalendarEvent[] = appointments;

  return (
    <div className="w-full h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth'
        }}
        events={appointments} 
        locale={ptBrLocale}
        buttonText={{
            today:    'Hoje',
            month:    'Mês',
            week:     'Semana',
            day:      'Dia',
            list:     'Lista'
          }}
        allDaySlot={false}
        editable={true}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        eventContent={(eventInfo) => <CustomEventContent {...eventInfo} />}
        selectable={true}
        select={onSelectSlot}
        // Readicionar callbacks de hover
        eventMouseEnter={onEventMouseEnter}
        eventMouseLeave={onEventMouseLeave}
        // eventClick ainda não está ativo
        // eventClick={onSelectEvent}
      />
    </div>
  );
};

export default AppointmentCalendar; 