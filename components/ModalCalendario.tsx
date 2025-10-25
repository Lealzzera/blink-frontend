import styles from "./styles/modal.module.css";
import { X } from "lucide-react";
import { createClient } from "@/lib/client";
const supabase = createClient();

interface ModalProps {
  event: any;
  eventDetails?: any; // detalhes do GET /appointments/{id}/details
  onClose: () => void;
  onEventRemoved: (eventId: string) => void; // para atualizar calendário
}

export default function ModalDetalhes({
  event,
  eventDetails,
  onClose,
  onEventRemoved,
}: ModalProps) {
  const { start, end, extendedProps } = event;

  // Usa os detalhes específicos se disponíveis, senão extendedProps do evento
  const paciente =
    eventDetails?.patient?.name ??
    eventDetails?.paciente ??
    extendedProps?.paciente ??
    "Desconhecido";
  const telefone =
    eventDetails?.patient?.phone_number ??
    eventDetails?.phone ??
    extendedProps?.phone ??
    "Desconhecido";
  const tipo =
    eventDetails?.service_type ??
    eventDetails?.tipo ??
    extendedProps?.tipo ??
    "Desconhecido";
  const notas = eventDetails.notes;

  const handleDelete = async () => {
    if (!extendedProps || !extendedProps.id) {
      console.warn("ID do agendamento não encontrado:", extendedProps);
      return;
    }

    const url = `http://localhost:3003/api/v1/appointments/status`;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_id: extendedProps.id,
          new_status: "CANCELADO",
        }),
      });

      if (res.ok) {
        event.remove();
        onEventRemoved(extendedProps.id);
        onClose();
      } else {
        const errorText = await res.text();
        console.error(`Erro ao cancelar: ${res.status} - ${errorText}`);
      }
    } catch (err) {
      console.error("Erro ao tentar cancelar agendamento:", err);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2>Detalhes do Agendamento</h2>
        <p>
          <strong>Paciente:</strong> {paciente}
        </p>
        <p>
          <strong>Telefone:</strong> {telefone}
        </p>
        <p>
          <strong>Notas:</strong> {notas}
        </p>
        <p>
          <strong>Tipo:</strong> {tipo}
        </p>
        <p>
          <strong>Data:</strong>{" "}
          {start ? start.toLocaleDateString() : "Data inválida"}
        </p>
        <p>
          <strong>Hora:</strong> {start ? start.toLocaleTimeString() : ""} -{" "}
          {end ? end.toLocaleTimeString() : ""}
        </p>

        <div className={styles.actions}>
          <div className={styles.containerBtn}>
            <button className={styles.cancelar} onClick={handleDelete}>
              Cancelar agendamento
            </button>
          </div>
        </div>

        <button className={styles.closeIcon} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
