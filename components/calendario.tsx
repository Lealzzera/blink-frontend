"use client";

import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import ModalDetalhes from "./ModalCalendario";
import ModalNovoAgendamento from "./ModalNovoAgendamento";
import ModalValorVenda from "./ModalValorVenda";
import styles from "./styles/calendario.module.css";

export default function CalendarioClient({
  initialConfig,
  initialEvents,
  initialStatuses,
  initialSales,
  token
}: {
  initialConfig: { currentDuration: number; allowOverbooking: boolean };
  initialEvents: any[];
  initialStatuses: Record<string, string>;
  initialSales: Record<string, any[]>;
  token: string;
}) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDetails, setEventDetails] = useState<any | null>(null);
  const [openNewAppointmentModal, setOpenNewAppointmentModal] = useState(false);
  const [events, setEvents] = useState<any[]>(initialEvents);
  const [eventStatuses, setEventStatuses] = useState<Record<string, string>>(initialStatuses);
  const [eventSales, setEventSales] = useState<Record<string, any[]>>(initialSales);
  const [currentDuration] = useState(initialConfig?.currentDuration ?? 30);
  const [allowOverbooking] = useState(initialConfig?.allowOverbooking ?? false);
  const [showValorVendaModal, setShowValorVendaModal] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  const API_BASE = "https://be.blinkdentalmarketing.com.br/api/v1";

  const updateEventStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointment_id: Number(id), new_status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status do agendamento");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
      return false;
    }
  };

  const handleStatusToggle = async (id: string, action: "confirm" | "attend" | "sale") => {
    const currentStatus = eventStatuses[id];

    if (action === "confirm") {
      const success = await updateEventStatus(
        id,
        currentStatus === "AGENDADO" ? "CONFIRMADO" : "AGENDADO"
      );
      if (success)
        setEventStatuses((prev) => ({
          ...prev,
          [id]: currentStatus === "AGENDADO" ? "CONFIRMADO" : "AGENDADO",
        }));
    } else if (action === "attend") {
      const success = await updateEventStatus(
        id,
        currentStatus === "COMPARECEU" ? "CONFIRMADO" : "COMPARECEU"
      );
      if (success)
        setEventStatuses((prev) => ({
          ...prev,
          [id]: currentStatus === "COMPARECEU" ? "CONFIRMADO" : "COMPARECEU",
        }));
    } else if (action === "sale") {
      setCurrentEventId(id);
      setShowValorVendaModal(true);
    }
  };

  const handleConfirmValorVenda = (valor: string) => {
    if (!currentEventId) return;
    const newSale = {
      appointment_id: Number(currentEventId),
      value: parseFloat(valor),
    };
    setEventSales((prev) => ({
      ...prev,
      [currentEventId]: [...(prev[currentEventId] || []), newSale],
    }));
    setCurrentEventId(null);
    setShowValorVendaModal(false);
  };

  // Função para adicionar novo evento ao calendário
  const addNewEvent = (newEvent: any) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setEventStatuses((prev) => ({
      ...prev,
      [newEvent.extendedProps.id]: "AGENDADO",
    }));
    setEventSales((prev) => ({
      ...prev,
      [newEvent.extendedProps.id]: [],
    }));
  };

  function EventoConteudo({ event, viewType }: { event: any; viewType: string }) {
    const [isHovered, setIsHovered] = useState(false);
    const [caption, setCaption] = useState("");
    const id = event.extendedProps.id;
    const status = eventStatuses[id] || "AGENDADO";
    const hasSales = eventSales[id] && eventSales[id].length > 0;
    const horaConsulta = event.start
      ? new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    const displayStatus = hasSales ? "venda" : status.toLowerCase();

    const Buttons = () => (
      <div className={styles.buttonsContainer}>
        <div className={styles.tooltipWrapper}>
          <button
            className={`${styles.checkButton} ${
              status === "CONFIRMADO" || status === "COMPARECEU" ? styles.checked : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle(id, "confirm");
            }}
            onMouseEnter={() => setCaption("Confirmou")}
            onMouseLeave={() => setCaption("")}
          >
            {status === "CONFIRMADO" || status === "COMPARECEU" ? "✔" : ""}
          </button>
        </div>
        <div className={styles.tooltipWrapper}>
          <button
            className={`${styles.checkButton} ${status === "COMPARECEU" ? styles.checked : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle(id, "attend");
            }}
            onMouseEnter={() => setCaption("Compareceu")}
            onMouseLeave={() => setCaption("")}
          >
            {status === "COMPARECEU" ? "✔" : ""}
          </button>
        </div>
        <div className={styles.tooltipWrapper}>
          <button
            className={`${styles.checkButton} ${hasSales ? styles.checked : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle(id, "sale");
            }}
            onMouseEnter={() => setCaption("Registrar Venda")}
            onMouseLeave={() => setCaption("")}
          >
            {hasSales ? "✔" : ""}
          </button>
        </div>
      </div>
    );

    const StatusText = () => <div className={styles.statusContainer}>{displayStatus.toUpperCase()}</div>;

    return (
      <div
        className={viewType === "dayGridMonth" ? styles.eventContentMonth : styles.eventContent}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.eventHeader}>
          {currentDuration > 30 && (
            <>
              <span className={styles.pacienteName}>{event.title}</span>
              <span className={styles.consultationTime}>{horaConsulta}</span>
            </>
          )}
        </div>
        <div className={styles.eventFooterTop}>{isHovered ? <Buttons /> : <StatusText />}</div>
        {caption ? <span className={styles.statusCaption}>{caption.toUpperCase()}</span> : null}
      </div>
    );
  }

  const renderEventContent = (arg: EventContentArg) => (
    <EventoConteudo event={arg.event} viewType={arg.view.type} />
  );

  const eventClassNames = (arg: any) => {
    const id = arg.event.extendedProps.id;
    const status = eventStatuses[id];
    const hasSales = eventSales[id] && eventSales[id].length > 0;
    if (hasSales) return styles.eventVenda;
    if (status === "COMPARECEU") return styles.eventCompareceu;
    if (status === "CONFIRMADO") return styles.eventConfirmado;
    return styles.eventAgendado;
  };

  const handleEventClick = async (info: EventClickArg) => {
    const id = info.event.extendedProps.id;
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Erro ao buscar detalhes do agendamento ${id}`);
      const details = await res.json();
      setEventDetails(details);
    } catch (error) {
      console.error("Erro ao buscar detalhes do agendamento:", error);
      setEventDetails(null);
    }
    setSelectedEvent(info.event);
  };

  const handleEventRemoved = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.extendedProps.id !== id));
    setEventStatuses((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
    setEventSales((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
  };

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
          eventOverlap
          events={events}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventClassNames={eventClassNames}
        />
      </div>
      {selectedEvent && (
        <ModalDetalhes
          event={selectedEvent}
          eventDetails={eventDetails}
          onClose={() => {
            setSelectedEvent(null);
            setEventDetails(null);
          }}
          onEventRemoved={handleEventRemoved}
        />
      )}
      <button className={styles.fab} onClick={() => setOpenNewAppointmentModal(true)}>
        +
      </button>
      {openNewAppointmentModal && (
        <ModalNovoAgendamento
          onClose={() => setOpenNewAppointmentModal(false)}
          onNewEvent={addNewEvent}
          token={token}
        />
      )}
      {showValorVendaModal && currentEventId && (
        <ModalValorVenda
          onClose={() => {
            setCurrentEventId(null);
            setShowValorVendaModal(false);
          }}
          onConfirm={handleConfirmValorVenda}
          appointmentId={Number(currentEventId)}
        />
      )}
    </div>
  );
}