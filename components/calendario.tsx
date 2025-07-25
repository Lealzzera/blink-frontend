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
import ModalValorVenda from "./ModalValorVenda";
import styles from "./styles/calendario.module.css";

export default function Calendario() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDetails, setEventDetails] = useState<any | null>(null);
  const [openNewAppointmentModal, setOpenNewAppointmentModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, string>>({});
  const [eventSales, setEventSales] = useState<Record<string, any[]>>({});
  const [currentDuration, setCurrentDuration] = useState(30);
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [showValorVendaModal, setShowValorVendaModal] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  const API_BASE = "https://be.blinkdentalmarketing.com.br";

  const fetchConfigurations = async () => {
    try {
      const res = await fetch(`${API_BASE}/configurations/appointments/1`, {
        method: "GET",
        mode: "cors",
      });
      if (!res.ok) throw new Error("Erro ao buscar configurações");
      const data = await res.json();
      setCurrentDuration(data.duration || 30);
      setAllowOverbooking(data.overbooking || false);
      console.log("Abaixo")
      console.log(data)
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    }
  };

  const fetchAvailability = async () => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    try {
      const res = await fetch(
        `${API_BASE}/appointments/availability?start_date=${startDate}&end_date=${endDate}`,
        { mode: "cors" }
      );

      if (!res.ok) throw new Error("Erro ao buscar dados de agendamentos");
      const availability = await res.json();
      console.log(availability)

      const calcEnd = (start: string, durMin: number) => {
        const [h, m] = start.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        return new Date(date.getTime() + durMin * 60000).toTimeString().slice(0, 5);
      };

      const grouped: Record<string, any[]> = {};
      const statuses: Record<string, string> = {};
      const sales: Record<string, any[]> = {};

      for (const day of availability) {
        if (!day.date || !Array.isArray(day.appointments)) continue;

        for (const ag of day.appointments) {
          if (!ag.name?.trim()) continue;

          const key = `${day.date}T${ag.time}`;
          if (!grouped[key]) grouped[key] = [];

          const event = {
            title: ag.name,
            start: key,
            end: `${day.date}T${calcEnd(ag.time, currentDuration)}`,
            extendedProps: {
              paciente: ag.name,
              phone: ag.phone,
              tipo: "Consulta",
              id: ag.id,
            },
          };

          grouped[key].push(event);
          statuses[ag.id] = ag.status || "AGENDADO";
          if (ag.sales && ag.sales.length > 0) {
            sales[ag.id] = ag.sales;
          }
        }
      }

      const finalEvents = Object.values(grouped).flatMap((list: any[]) => {
        if (!allowOverbooking) return list.slice(0, 1);
        return list.slice(0, 2);
      });

      setEvents(finalEvents);
      setEventStatuses(statuses);
      setEventSales(sales);
    } catch (error) {
      console.error("Erro ao buscar disponibilidades:", error);
    }
  };

  const updateEventStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const success = await updateEventStatus(id, currentStatus === "AGENDADO" ? "CONFIRMADO" : "AGENDADO");
      if (success) setEventStatuses((prev) => ({ ...prev, [id]: currentStatus === "AGENDADO" ? "CONFIRMADO" : "AGENDADO" }));
    } else if (action === "attend") {
      const success = await updateEventStatus(id, currentStatus === "COMPARECEU" ? "CONFIRMADO" : "COMPARECEU");
      if (success) setEventStatuses((prev) => ({ ...prev, [id]: currentStatus === "COMPARECEU" ? "CONFIRMADO" : "COMPARECEU" }));
    } else if (action === "sale") {
      setCurrentEventId(id);
      setShowValorVendaModal(true);
    }
  };

  const handleConfirmValorVenda = async (valor: string) => {
    if (!currentEventId) return;

    const now = new Date();
    const datePart = now.toISOString().split("T")[0];
    const timePart = now.toTimeString().split(":").slice(0,2).join(":");
    const registeredAt = `${datePart} ${timePart}`;

    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: Number(currentEventId),
          value: parseFloat(valor),
          service_type: 1,
          registered_by_user: 1,
          registered_at: registeredAt,
        }),
      });

      if (!res.ok) throw new Error("Erro ao registrar venda");

      const newSale = await res.json();

      setEventSales((prev) => ({
        ...prev,
        [currentEventId]: [...(prev[currentEventId] || []), newSale],
      }));

      setCurrentEventId(null);
      setShowValorVendaModal(false);
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
    }
  };

  const renderEventContent = (arg: EventContentArg) => {
    const id = arg.event.extendedProps.id;
    const status = eventStatuses[id];
    const hasSales = eventSales[id] && eventSales[id].length > 0;
    const view = arg.view.type;

    const Buttons = () => (
      <>
        <button
          className={`${styles.checkButton} ${status === "CONFIRMADO" || status === "COMPARECEU" ? styles.checked : ""}`}
          onClick={(e) => { e.stopPropagation(); handleStatusToggle(id, "confirm"); }}
        >
          {status === "CONFIRMADO" || status === "COMPARECEU" ? "✔" : ""}
        </button>
        <button
          className={`${styles.checkButton} ${status === "COMPARECEU" ? styles.checked : ""}`}
          onClick={(e) => { e.stopPropagation(); handleStatusToggle(id, "attend"); }}
        >
          {status === "COMPARECEU" ? "✔" : ""}
        </button>
        <button
          className={`${styles.checkButton} ${hasSales ? styles.checked : ""}`}
          onClick={(e) => { e.stopPropagation(); handleStatusToggle(id, "sale"); }}
        >
          {hasSales ? "✔" : ""}
        </button>
      </>
    );

    if (view === "dayGridMonth") {
      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{arg.event.title}</b>
          <div style={{ display: "flex", gap: "4px" }}><Buttons /></div>
        </div>
      );
    }

    return (
      <div style={{ position: "absolute", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{
          flex: "1 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontSize: currentDuration <= 30 ? "0.9em" : "0.8em",
        }}>
          {currentDuration > 30 ? <div>{arg.timeText}</div> : arg.timeText}
        </div>
        <div style={{ position: "relative", top: "-4px", right: "2px", display: "flex", gap: "4px", zIndex: 1 }}>
          <Buttons />
        </div>
      </div>
    );
  };

  const eventClassNames = (arg: any) => {
    const id = arg.event.extendedProps.id;
    const status = eventStatuses[id];
    const hasSales = eventSales[id] && eventSales[id].length > 0;
    if (hasSales) return styles.eventVenda; // alterado aqui
    if (status === "COMPARECEU") return styles.eventCompareceu;
    if (status === "CONFIRMADO") return styles.eventConfirmado;
    return styles.eventAgendado;
  };

  const handleEventClick = async (info: EventClickArg) => {
    const id = info.event.extendedProps.id;
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/details`, { method: "GET", mode: "cors" });
      if (!res.ok) throw new Error(`Erro ao buscar detalhes do agendamento ${id}`);
      const details = await res.json();
      console.log(details)
      setEventDetails(details);
    } catch (error) {
      console.error("Erro ao buscar detalhes do agendamento:", error);
      setEventDetails(null);
    }
    setSelectedEvent(info.event);
  };

  const handleEventRemoved = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.extendedProps.id !== id));
    setEventStatuses((prev) => { const c = { ...prev }; delete c[id]; return c; });
    setEventSales((prev) => { const c = { ...prev }; delete c[id]; return c; });
  };

  useEffect(() => { fetchConfigurations(); }, []);
  useEffect(() => { fetchAvailability(); }, [currentDuration, allowOverbooking]);

  return (
    <div className={styles.container}>
      <div className={styles.customCalendar}>
        <FullCalendar
          locale={ptBrLocale}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
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
          onClose={() => { setSelectedEvent(null); setEventDetails(null); fetchAvailability(); }}
          onEventRemoved={handleEventRemoved}
        />
      )}
      <button className={styles.fab} onClick={() => setOpenNewAppointmentModal(true)}>+</button>
      {openNewAppointmentModal && (
        <ModalNovoAgendamento onClose={() => { setOpenNewAppointmentModal(false); fetchAvailability(); }} />
      )}
      {showValorVendaModal && currentEventId && (
        <ModalValorVenda
          onClose={() => { setCurrentEventId(null); setShowValorVendaModal(false); }}
          onConfirm={handleConfirmValorVenda}
          appointmentId={Number(currentEventId)}
        />
      )}
    </div>
  );
}
