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
  const [openNewAppointmentModal, setOpenNewAppointmentModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, string>>({});
  const [eventSales, setEventSales] = useState<Record<string, string>>({});
  const [currentDuration, setCurrentDuration] = useState(30);
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [showValorVendaModal, setShowValorVendaModal] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  const fetchConfigurations = async () => {
    try {
      const res = await fetch("http://localhost:51234/configurations/appointments/1", {
        method: "GET",
        mode: "cors",
      });
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
    const endDate = new Date(today.setDate(today.getDate() + 7)).toISOString().split("T")[0];

    try {
      const res = await fetch(
        `http://localhost:51234/appointments/availability?start_date=${startDate}&end_date=${endDate}`,
        { mode: "cors" }
      );
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
      const sales: Record<string, string> = {};

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
          if (ag.sale_value) sales[ag.id] = ag.sale_value;
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

  const updateEventStatus = async (id: string, newStatus: string, saleValue?: string) => {
    try {
      const res = await fetch("http://localhost:51234/appointments/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          appointment_id: Number(id), 
          new_status: newStatus,
          sale_value: saleValue 
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar status do agendamento");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
      return false;
    }
  };

  const handleStatusToggle = async (id: string, action: "confirm" | "attend") => {
    const currentStatus = eventStatuses[id];

    if (action === "confirm") {
      if (currentStatus === "AGENDADO") {
        const success = await updateEventStatus(id, "CONFIRMADO");
        if (success) {
          setEventStatuses((prev) => ({ ...prev, [id]: "CONFIRMADO" }));
          setEventSales((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      } else {
        const success = await updateEventStatus(id, "AGENDADO");
        if (success) {
          setEventStatuses((prev) => ({ ...prev, [id]: "AGENDADO" }));
          setEventSales((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      }
    } else if (action === "attend") {
      if (currentStatus === "CONFIRMADO") {
        setCurrentEventId(id);
        setShowValorVendaModal(true);
      } else {
        const success = await updateEventStatus(id, "CONFIRMADO");
        if (success) {
          setEventStatuses((prev) => ({ ...prev, [id]: "CONFIRMADO" }));
          setEventSales((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      }
    }
  };

  const handleConfirmValorVenda = async (valor: string) => {
    if (!currentEventId) return;
    
    const newStatus = valor ? "VENDA" : "COMPARECEU";
    const success = await updateEventStatus(currentEventId, newStatus, valor);
    
    if (success) {
      setEventStatuses((prev) => ({ ...prev, [currentEventId]: newStatus }));
      if (valor) {
        setEventSales((prev) => ({ ...prev, [currentEventId]: valor }));
      } else {
        setEventSales((prev) => {
          const copy = { ...prev };
          delete copy[currentEventId];
          return copy;
        });
      }
    }
    
    setCurrentEventId(null);
    setShowValorVendaModal(false);
  };

  const renderEventContent = (arg: EventContentArg) => {
    const id = arg.event.extendedProps.id;
    const status = eventStatuses[id];
    const view = arg.view.type;

    const Buttons = () => (
      <>
        <button
          className={`${styles.checkButton} ${
            status === "CONFIRMADO" || status === "COMPARECEU" || status === "VENDA" ? styles.checked : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleStatusToggle(id, "confirm");
          }}
        >
          {status === "CONFIRMADO" || status === "COMPARECEU" || status === "VENDA" ? "✔" : ""}
        </button>
        <button
          className={`${styles.checkButton} ${
            status === "COMPARECEU" || status === "VENDA" ? styles.checked : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleStatusToggle(id, "attend");
          }}
        >
          {status === "COMPARECEU" || status === "VENDA" ? "✔" : ""}
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
        <div
          style={{
            flex: "1 1 auto",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: currentDuration <= 30 ? "0.9em" : "0.8em",
          }}
        >
          {currentDuration > 30 ? <div>{arg.timeText}</div> : arg.timeText}
        </div>
        <div
          style={{
            position: "relative",
            top: "-4px",
            right: "2px",
            display: "flex",
            gap: "4px",
            zIndex: 1,
          }}
        >
          <Buttons />
        </div>
      </div>
    );
  };

  const eventClassNames = (arg: any) => {
    const id = arg.event.extendedProps.id;
    const status = eventStatuses[id];
    const hasSale = !!eventSales[id];
    
    if (status === "VENDA" && hasSale) return styles.eventVendaComValor;
    if (status === "VENDA") return styles.eventVendaSemValor;
    if (status === "COMPARECEU") return styles.eventCompareceu;
    if (status === "CONFIRMADO") return styles.eventConfirmado;
    return styles.eventAgendado;
  };

  const handleEventClick = async (info: EventClickArg) => {
    const id = info.event.extendedProps.id;
    try {
      const res = await fetch(`http://localhost:51234/appointments/${id}/details`, {
        method: "GET",
        mode: "cors",
      });
      if (!res.ok) throw new Error(`Erro ao buscar detalhes do agendamento ${id}`);
      await res.json();
    } catch (error) {
      console.error("Erro ao buscar detalhes do agendamento:", error);
    }
    setSelectedEvent(info.event);
  };

  const handleEventRemoved = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.extendedProps.id !== id));
    setEventStatuses((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setEventSales((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [currentDuration, allowOverbooking]);

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

      {showValorVendaModal && (
        <ModalValorVenda
          onClose={() => {
            setCurrentEventId(null);
            setShowValorVendaModal(false);
          }}
          onConfirm={handleConfirmValorVenda}
          appointmentId={selectedEvent?.extendedProps?.id ? Number(selectedEvent.extendedProps.id) : 1}
        />
      )}
    </div>
  );
}