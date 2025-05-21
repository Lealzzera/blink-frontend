"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { EventClickArg } from "@fullcalendar/core";
import Modal from "./ModalCalendario";
import styles from "./styles/calendario.module.css";
import { useCalendarConfig } from "@/context/CalendarConfigContext";

export default function Calendario() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const { defaultDuration, allowDoubleBooking } = useCalendarConfig();

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

  const closeModal = () => setSelectedEvent(null);

  useEffect(() => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.setDate(today.getDate() + 7)).toISOString().split("T")[0];

    const fetchAvailability = async () => {
      const mockData = [
        {
          date: "2025-05-13",
          open: "09:00",
          close: "18:00",
          break_start: "12:00",
          break_end: "13:00",
          appointments: [
            { name: "João da Silva", time: "10:00", phone: "(11)99999-9999" },
            { name: "Lucas Benini", time: "15:00", phone: "(11)99999-9999" },
            { name: "Teste 2", time: "10:00", phone: "(11)98888-8888" }
          ]
        },
        {
          date: "2025-05-14",
          open: "09:00",
          close: "18:00",
          break_start: "12:00",
          break_end: "13:00",
          appointments: [
            { name: "Agendamento 1", time: "12:30", phone: "(11)99999-9999" },
            { name: "Agendamento 2", time: "12:30", phone: "(11)98888-8888" }
          ]
        }
      ];

      const calculateEndTime = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        return endDate.toTimeString().slice(0, 5);
      };

      const grouped: Record<string, any[]> = {};

      for (const dia of mockData) {
        const { date, appointments } = dia;

        for (const agendamento of appointments) {
          const key = `${date}T${agendamento.time}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            title: agendamento.name,
            start: key,
            end: `${date}T${calculateEndTime(agendamento.time, defaultDuration)}`,
            extendedProps: {
              paciente: agendamento.name,
              phone: agendamento.phone,
              tipo: "Consulta"
            }
          });
        }
      }

      const finalEvents = Object.values(grouped).flatMap((agendamentos) => {
        return allowDoubleBooking ? agendamentos.slice(0, 2) : agendamentos.slice(0, 1);
      });

      setEvents(finalEvents);
    };

    fetchAvailability();
  }, [defaultDuration, allowDoubleBooking]);

  return (
    <div className={styles.container}>
      <div className={styles.customCalendar}>
        <FullCalendar
          locale={ptBrLocale}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          editable
          selectable
          events={events}
          eventClick={handleEventClick}
        />
      </div>

      {selectedEvent && (
        <Modal event={selectedEvent} onClose={closeModal} />
      )}
    </div>
  );
}
