"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styles from "./styles/calendario.module.css";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

export default function Calendario() {
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
          events={[
            {
              title: "Reunião",
              start: "2025-05-07T10:00:00",
              end: "2025-05-07T11:00:00"
            },
            {
              title: "Estudo",
              start: "2025-05-08T15:00:00"
            }
          ]}
        />
      </div>
    </div>
  );
}
