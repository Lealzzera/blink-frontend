"use client";
import ptBr from "@fullcalendar/core/locales/pt-br";
import React, { useEffect, useState, useCallback } from "react";
import styles from "./style.module.css";
import Calendar from "@fullcalendar/react";
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import ButtonComponent from "@/app/components/ButtonComponent/ButtonComponent";
import InputComponent from "@/app/components/InputComponent/InputComponent";
import EventDetailsComponent from "@/app/components/EventDetailsComponent/EventDetailsComponent";
import { useUser } from "@/app/context/userContext";
import { getAppointments } from "@/app/actions/getAppointments";
import { putAppointmentStatus } from "@/app/actions/putAppointmentStatus";
import { postAppointment } from "@/app/actions/postAppointment";
import { toast, ToastContainer } from "react-toastify";
export default function Schedules() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTelephone, setFormTelephone] = useState<string>("");
  const [formPatientName, setFormPatientName] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [formTime, setFormTime] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [dataRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [error, setError] = useState<string>("");
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormDate("");
    setFormTime("");
    setFormDescription("");
    setError("");
    setFormPatientName("");
    setFormTelephone("");
  };

  const handleCreate = async () => {
    if (!formTelephone || !formDate || !formTime || !formPatientName) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    const formattedTelephone = formTelephone.replace(/\D/g, "");
    const [day, month, year] = formDate.split("/");
    const isoDate = `${year}-${month}-${day}T${formTime}:00Z`;
    const dateObj = new Date(isoDate);
    if (isNaN(dateObj.getTime())) {
      setError("Data ou horário inválido.");
      return;
    }
    const isoString = dateObj.toISOString();
    setError("");
    const response: any = await postAppointment({
      notes: formDescription,
      patientNumber: formattedTelephone,
      scheduledTime: isoString,
      patientName: formPatientName,
    });

    if (response.status === 201) {
      toast("Agendamento criado com sucesso.", {
        theme: "colored",
        type: "success",
      });

      handleCloseModal();
      await fetchAppointments();
      return;
    }

    toast(
      "Ocorreu um erro ao criar o agendamento. Tente novamente mais tarde.",
      {
        theme: "colored",
        type: "error",
      },
    );

    setError("Ocorreu um erro ao criar o agendamento.");
  };

  const handleChangeTelephone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");

    let formatted = "";

    if (digits.length > 0) {
      formatted += "(" + digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ")" + digits.substring(2, 7);
    }
    if (digits.length >= 8) {
      formatted += "-" + digits.substring(7, 11);
    }

    setFormTelephone(formatted);
  };

  const handleChangePatientName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormPatientName(e.target.value);
  };

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");

    let formatted = "";

    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += "/" + digits.substring(2, 4);
    }
    if (digits.length >= 5) {
      formatted += "/" + digits.substring(4, 8);
    }

    setFormDate(formatted);
  };

  const handleChangeTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");

    let formatted = "";

    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ":" + digits.substring(2, 4);
    }

    setFormTime(formatted);
  };

  const handleFormatDateSet = (dateInfo: any) => {
    const startDateIso = new Date(dateInfo.startStr)
      .toISOString()
      .split("T")[0];
    const endDateIso = new Date(dateInfo.endStr).toISOString().split("T")[0];
    setDateRange({ start: startDateIso, end: endDateIso });
  };

  const handlePresenterAppointmentsList = (appointmentsData: any[]) => {
    return appointmentsData.flatMap((appointment: any) => {
      const date = appointment.date;
      return (appointment.appointments || []).map((appt: any) => {
        const time = appt.time || "00:00";
        const isoTime = `${date}T${time}`;

        return {
          id: String(appt.id),
          title: appt.patient_name,
          start: new Date(isoTime).toISOString(),
          extendedProps: {
            phone: appt.patient_phone,
            duration: appt.duration,
            status: appt.status,
            notes: appt.notes,
            dayInfo: {
              open: appointment.open,
              close: appointment.close,
              break_start: appointment.break_start,
              break_end: appointment.break_end,
            },
          },
        };
      });
    });
  };

  const fetchAppointments = useCallback(async () => {
    if (!dataRange.start) return;
    try {
      const appointments = await getAppointments({
        startDate: dataRange.start,
        endDate: dataRange.end,
      });

      console.log("appointments response:", appointments);

      if (!appointments || !Array.isArray(appointments)) {
        console.error("Appointments inválido ou não é um array:", appointments);
        return;
      }

      const appointmentsFormatted =
        handlePresenterAppointmentsList(appointments);

      console.log("appointmentsFormatted:", appointmentsFormatted);

      setEvents(appointmentsFormatted);
    } catch (err) {
      console.error("Erro ao buscar appointments:", err);
    }
  }, [dataRange]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = useCallback(
    async (payload: { id?: string; status: string }) => {
      setSelectedEvent(null);
      await putAppointmentStatus({
        appointmentId: String(payload.id),
        status: payload.status,
      });
      await fetchAppointments();
    },
    [fetchAppointments],
  );
  return (
    <div className={styles.schedulesContainer}>
      <ToastContainer />
      <h1>Agendamentos</h1>
      <div className={styles.buttonContainer}>
        <button className={styles.newScheduleButton} onClick={handleOpenModal}>
          Novo agendamento
        </button>
        <div className={styles.legend}>
          <div>
            <div className={styles.scheduled}></div>
            <span>Agendado</span>
          </div>
          <div>
            <div className={styles.confirmed}></div>
            <span>Confirmado</span>
          </div>
          <div>
            <div className={styles.showedUp}></div>
            <span>Compareceu</span>
          </div>
          <div>
            <div className={styles.notShowedUp}></div>
            <span>Não compareceu</span>
          </div>
        </div>
      </div>
      <div className={styles.calendarContainer}>
        {selectedEvent && (
          <EventDetailsComponent
            handleUpdateStatus={(event) => handleUpdateStatus(event)}
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
        <Calendar
          datesSet={(info) => {
            handleFormatDateSet(info);
          }}
          eventClick={(info) => {
            const ev: EventInput = {
              id: info.event.id,
              title: info.event.title,
              start: info.event.start
                ? info.event.start.toISOString()
                : info.event.startStr,
              extendedProps: (info.event as any).extendedProps,
            };
            setSelectedEvent(ev);
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          plugins={[dayGridPlugin]}
          locale={ptBr}
          initialView="dayGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridWeek,dayGridMonth",
          }}
          events={events}
          eventClassNames={(arg) => {
            const status = (arg.event.extendedProps as any)?.status;
            const key = `status_${String(status || "").toUpperCase()}`;
            const statusClass = (styles as any)[key];
            return [styles.scheduleItem, statusClass].filter(
              Boolean,
            ) as string[];
          }}
          dayCellClassNames={(arg) => {
            if (arg.isToday) {
              return [styles.dayCellCustom];
            }
            return [];
          }}
          buttonText={{ month: "Mês", week: "Semana" }}
          height={"100%"}
        />
      </div>
      {isModalOpen && (
        <div className={styles.scheduleModal}>
          <div className={styles.modalContent}>
            <h2>Novo Agendamento</h2>
            <InputComponent
              label="Nome do paciente"
              placeholder="Digite o nome do paciente"
              value={formPatientName}
              handleChangeInput={handleChangePatientName}
            />
            <InputComponent
              label="Telefone"
              placeholder="(00)00000-0000"
              value={formTelephone}
              handleChangeInput={handleChangeTelephone}
            />
            <InputComponent
              label="Data"
              placeholder="DD/MM/AAAA"
              value={formDate}
              handleChangeInput={handleChangeDate}
            />
            <InputComponent
              label="Horário"
              placeholder="00:00"
              value={formTime}
              handleChangeInput={handleChangeTime}
            />
            <InputComponent
              type="text"
              value={formDescription}
              handleChangeInput={(e) => setFormDescription(e.target.value)}
              placeholder="Descrição do agendamento"
            />
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.modalButtons}>
              <ButtonComponent
                text="Cancelar"
                handleClickButton={handleCloseModal}
                style={{
                  background: "transparent",
                  color: "var(--red-300)",
                  border: "2px solid var(--red-300)",
                }}
              />
              <ButtonComponent text="Criar" handleClickButton={handleCreate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
