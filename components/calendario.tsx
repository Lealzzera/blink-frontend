"use client";

import React, { useState, useEffect } from "react";
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
import { createClient } from '@/lib/client'

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

  const supabase = createClient()
  const API_BASE = "https://be.blinkdentalmarketing.com.br/api/v1"

  const fetchConfigurations = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(`${API_BASE}/configurations/appointments/1`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })

      if (!res.ok) throw new Error("Erro ao buscar configurações");
      const data = await res.json();
      setCurrentDuration(data.duration || 30);
      setAllowOverbooking(data.overbooking || false);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    }
  };

  const fetchAvailability = async () => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    try {
      const res = await fetch(
        `${API_BASE}/appointments/availability?start_date=${startDate}&end_date=${endDate}`,
        {
          mode: "cors",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!res.ok) throw new Error("Erro ao buscar dados de agendamentos");
      const availability = await res.json();

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
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(`${API_BASE}/appointments/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ appointment_id: Number(id), new_status: newStatus }),
      })

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

  // 🔹 Apenas atualiza o estado local, sem POST /sales
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

  function EventoConteudo({
    event,
    viewType,
    eventStatuses,
    eventSales,
    currentDuration,
    handleStatusToggle,
  }: {
    event: any;
    viewType: string;
    eventStatuses: Record<string, string>;
    eventSales: Record<string, any[]>;
    currentDuration: number;
    handleStatusToggle: (id: string, action: "confirm" | "attend" | "sale") => void;
  }) {
    const [isHovered, setIsHovered] = useState(false);
    const [caption, setCaption] = useState('');
    const id = event.extendedProps.id;
    const status = eventStatuses[id] || "AGENDADO";
    const hasSales = eventSales[id] && eventSales[id].length > 0;
    const horaConsulta = event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const displayStatus = hasSales ? "venda" : status.toLowerCase();

    const Buttons = () => (
      <div className={styles.buttonsContainer}>
        <div className={styles.tooltipWrapper}>
          <button
            className={`${styles.checkButton} ${status === "CONFIRMADO" || status === "COMPARECEU" ? styles.checked : ""}`}
            onClick={(e) => { e.stopPropagation(); handleStatusToggle(id, "confirm"); }}
            onMouseEnter={() => setCaption("Confirmou")}
            onMouseLeave={() => setCaption('')}
          >
            {status === "CONFIRMADO" || status === "COMPARECEU" ? "✔" : ""}
          </button>
        </div>
        <div className={styles.tooltipWrapper}>
          <button
            className={`${styles.checkButton} ${status === "COMPARECEU" ? styles.checked : ""}`}
            onClick={(e) => { e.stopPropagation(); handleStatusToggle(id, "attend"); }}
            onMouseEnter={() => setCaption("Compareceu")}
            onMouseLeave={() => setCaption('')}
          >
            {status === "COMPARECEU" ? "✔" : ""}
          </button>
        </div>
        <div className={styles.tooltipWrapper}>
          <button
            className={`${styles.checkButton} ${hasSales ? styles.checked : ""}`}
            onClick={(e) => { e.stopPropagation(); handleStatusToggle(id, "sale"); }}
            onMouseEnter={() => setCaption("Registrar Venda")}
            onMouseLeave={() => setCaption('')}
          >
            {hasSales ? "✔" : ""}
          </button>
        </div>
      </div>
    );

    const StatusText = () => (
      <div className={styles.statusContainer}>
        {displayStatus.toUpperCase()}
      </div>
    );

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
        <div className={styles.eventFooterTop}>
          {isHovered ? <Buttons /> : <StatusText />}
        </div>
        {caption ? <span className={styles.statusCaption}>{caption.toUpperCase()}</span> : null}
      </div>
    );
  }

  const renderEventContent = (arg: EventContentArg) => {
    return (
      <EventoConteudo
        event={arg.event}
        viewType={arg.view.type}
        eventStatuses={eventStatuses}
        eventSales={eventSales}
        currentDuration={currentDuration}
        handleStatusToggle={handleStatusToggle}
      />
    );
  };

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
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(`${API_BASE}/appointments/${id}/details`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })

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
