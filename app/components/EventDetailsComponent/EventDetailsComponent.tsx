"use client";
import { useState } from "react";
import { EventInput } from "@fullcalendar/core";
import styles from "./style.module.css";
import ButtonComponent from "../ButtonComponent/ButtonComponent";

type AppointmentDetailsProps = {
  event: EventInput;
  onClose: () => void;
  handleUpdateStatus: (status: { id?: string; status: string }) => void;
};

export default function EventDetailsComponent({
  event,
  onClose,
  handleUpdateStatus,
}: AppointmentDetailsProps) {
  const [newStatus, setNewStatus] = useState<{ id?: string; status: string }>({
    id: "",
    status: "",
  });

  const handleChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus({ id: event.id, status: e.target.value });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Date(event.start as string).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <div className={styles.modalDetailsBg}>
      <div className={styles.modalContent}>
        <h3>Detalhes do agendamento</h3>
        <p>
          Paciente: <span>{event.title}</span>
        </p>
        <p>
          Data: <span>{formatDate(event.start as string)}</span>
        </p>
        <div className={styles.selectStatusContainer}>
          <select
            value={newStatus.status}
            onChange={handleChangeStatus}
            className={styles.selectStatus}
          >
            <option disabled value="">
              Selecione um status
            </option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="COMPARECEU">Compareceu</option>
            <option value="NAO_COMPARECEU">Não compareceu</option>
          </select>
        </div>
        <div className={styles.modalButtons}>
          <ButtonComponent
            text="Fechar"
            handleClickButton={onClose}
            style={{
              background: "transparent",
              color: "var(--red-300)",
              fontWeight: "600",
            }}
          />
          <ButtonComponent
            text="Atualizar"
            handleClickButton={() => handleUpdateStatus({ ...newStatus })}
          />
        </div>
      </div>
    </div>
  );
}
