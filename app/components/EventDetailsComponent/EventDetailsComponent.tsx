"use client";
import { useEffect, useState } from "react";
import { EventInput } from "@fullcalendar/core";
import styles from "./style.module.css";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { getAppointmentDetails } from "@/app/actions/getAppointmentsDetails";

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
  const [appontmentDetails, setAppointmentDetails] = useState<any>(null);

  console.log(event);

  const handleChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus({ id: event.id, status: e.target.value });
  };

  const formatDate = () => {
    return new Date(event.start as string).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchAppiontmentDetails = async () => {
      if (!event.id) return;
      const response = await getAppointmentDetails(+event.id);
      setAppointmentDetails(response);
    };

    fetchAppiontmentDetails();
  }, []);
  return (
    <div className={styles.modalDetailsBg}>
      <div className={styles.modalContent}>
        <h3>Detalhes do agendamento</h3>
        <p>
          Paciente: <span>{appontmentDetails?.patient?.name}</span>
        </p>
        <p>
          Telefone: <span>{appontmentDetails?.patient?.phone_number}</span>
        </p>
        <p>
          Data: <span>{formatDate()}</span>
        </p>
        <p>
          Anotações: <span>{appontmentDetails?.notes}</span>
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
