"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import ModalDetalhes from "./ModalCalendario";
import ModalNovoAgendamento from "./ModalNovoAgendamento";
import styles from "./styles/calendario.module.css";
import { useCalendarConfig } from "@/context/CalendarConfigContext";

export default function Calendario() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [openNewAppointmentModal, setOpenNewAppointmentModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [checkedEvents, setCheckedEvents] = useState<Record<string, boolean>>({});
  const { defaultDuration, allowDoubleBooking } = useCalendarConfig();

  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log("Evento clicado:", clickInfo.event);
    setSelectedEvent(clickInfo.event);
  };

  const toggleCheck = (eventId: string) => {
    setCheckedEvents((prev) => {
      const newChecked = { ...prev, [eventId]: !prev[eventId] };
      console.log("Evento marcado/desmarcado:", eventId, newChecked[eventId]);
      return newChecked;
    });
  };

  const fetchAvailability = async () => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(new Date().setDate(today.getDate() + 7))
      .toISOString()
      .split("T")[0];

    console.log("Buscando disponibilidade de", startDate, "até", endDate);

    try {
      const res = await fetch(
        `http://localhost:51234/appointments/availability?start_date=${startDate}&end_date=${endDate}`,
        { mode: "cors" }
      );
      if (!res.ok) throw new Error("Erro ao buscar dados");
      const data = await res.json();

      console.log("Dados recebidos:", data);

      const calculateEndTime = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        return endDate.toTimeString().slice(0, 5);
      };

      const grouped: Record<string, any[]> = {};

      for (const dia of data) {
        if (!dia.date || !Array.isArray(dia.appointments)) {
          console.warn("Formato inesperado para dia:", dia);
          continue;
        }
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
                tipo: "Consulta",
                id: agendamento.id,
              },
            });
          }
        }
      }

      const finalEvents = Object.values(grouped).flatMap((agendamentos) =>
        allowDoubleBooking ? agendamentos.slice(0, 2) : agendamentos.slice(0, 1)
      );

      console.log("Eventos finais processados:", finalEvents);

      setEvents(finalEvents);
    } catch (error) {
      console.error("Erro ao buscar disponibilidades:", error);
    }
  };

  const handleEventRemoved = (eventId: string) => {
    console.log("Evento removido:", eventId);
    setEvents((prevEvents) => prevEvents.filter((event) => event.extendedProps.id !== eventId));
    setCheckedEvents((prev) => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
  };

  const renderEventContent = (arg: EventContentArg) => {
    const eventId = arg.event.extendedProps.id;
    const isChecked = checkedEvents[eventId];
    const viewType = arg.view.type;

    if (viewType === "dayGridMonth") {
      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <b>{arg.event.title}</b>
          </div>
          <button
            className={`${styles.checkButton} ${isChecked ? styles.checked : styles.unchecked}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCheck(eventId);
            }}
            aria-label={isChecked ? "Desmarcar comparecimento" : "Marcar comparecimento"}
            style={{ marginLeft: "8px", flexShrink: 0 }}
          >
            {isChecked ? "✔" : ""}
          </button>
        </div>
      );
    }

    if (defaultDuration <= 30) {
      return (
        <div style={{ position: "relative" }}>
          <div>{arg.timeText}</div>
          <button
            className={`${styles.checkButton} ${isChecked ? styles.checked : styles.unchecked}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCheck(eventId);
            }}
          >
            {isChecked ? "✔" : ""}
          </button>
        </div>
      );
    } else {
      return (
        <div style={{ position: "relative" }}>
          <div>{arg.timeText}</div>
          <div><b>{arg.event.title}</b></div>
          <button
            className={`${styles.checkButton} ${isChecked ? styles.checked : styles.unchecked}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCheck(eventId);
            }}
          >
            {isChecked ? "✔" : ""}
          </button>
        </div>
      );
    }
  };

  const eventClassNames = (arg: any) => {
    const eventId = arg.event.extendedProps.id;
    return checkedEvents[eventId] ? styles.checkedEvent : styles.uncheckedEvent;
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
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          editable
          selectable
          events={events}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventClassNames={eventClassNames}
        />
      </div>

      {selectedEvent && (
        <ModalDetalhes
          event={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            fetchAvailability();
          }}
          onEventRemoved={handleEventRemoved}
        />
      )}

      <button className={styles.fab} onClick={() => setOpenNewAppointmentModal(true)}>
        +
      </button>

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
