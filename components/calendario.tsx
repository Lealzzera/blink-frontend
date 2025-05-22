"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { EventClickArg } from "@fullcalendar/core";
import ModalDetalhes from "./ModalCalendario";
import ModalNovoAgendamento from "./ModalNovoAgendamento";
import styles from "./styles/calendario.module.css";
import { useCalendarConfig } from "@/context/CalendarConfigContext";

export default function Calendario() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [openNewAppointmentModal, setOpenNewAppointmentModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const { defaultDuration, allowDoubleBooking } = useCalendarConfig();

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
  };

  const closeModal = () => setSelectedEvent(null);

  const fetchAvailability = async () => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.setDate(today.getDate() + 7)).toISOString().split("T")[0];

    try {
      const res = await fetch(
        `http://localhost:51234/appointments/availability?start_date=${startDate}&end_date=${endDate}`,
        { mode: "cors" }
      );
      if (!res.ok) throw new Error("Erro ao buscar dados");

      const data = await res.json();

      const calculateEndTime = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        return endDate.toTimeString().slice(0, 5);
      };

      const grouped: Record<string, any[]> = {};

      for (const dia of data) {
        const { date, appointments } = dia;

        for (const agendamento of appointments) {
          if (agendamento.name?.trim()) {
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
      }

      const finalEvents = Object.values(grouped).flatMap((agendamentos) => {
        return allowDoubleBooking ? agendamentos.slice(0, 2) : agendamentos.slice(0, 1);
      });

      setEvents(finalEvents);
    } catch (error) {
      console.error("Erro ao buscar disponibilidades:", error);
    }
  };

  useEffect(() => {
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

      {selectedEvent && <ModalDetalhes event={selectedEvent} onClose={closeModal} />}

      <button className={styles.fab} onClick={() => setOpenNewAppointmentModal(true)}>+</button>

      {openNewAppointmentModal && (
        <ModalNovoAgendamento
          onClose={() => {
            setOpenNewAppointmentModal(false);
            fetchAvailability();
          }}
        />
      )}
    </div>
  );
}
