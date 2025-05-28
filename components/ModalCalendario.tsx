import styles from "./styles/modal.module.css";
import { useState } from "react";
import { Check, X } from "lucide-react";

interface ModalProps {
  event: any;
  onClose: () => void;
  onEventRemoved: (eventId: string) => void; // Função para remover o evento do calendário
}

export default function ModalDetalhes({ event, onClose, onEventRemoved }: ModalProps) {
  const { start, end, extendedProps } = event;
  const [venda, setVenda] = useState("");

  const handleDelete = async () => {
    if (!extendedProps || !extendedProps.id) {
      console.warn("ID do agendamento não encontrado:", extendedProps);
      return;
    }

    const url = `http://localhost:51234/appointments/status`;

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointment_id: extendedProps.id,
          new_status: "CANCELADO",
        }),
      });

      if (res.ok) {
        event.remove(); // Remove o evento do calendário
        onEventRemoved(extendedProps.id); // Atualiza o estado no componente pai
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
        <p><strong>Paciente:</strong> {extendedProps?.paciente ?? "Desconhecido"}</p>
        <p><strong>Telefone:</strong> {extendedProps?.phone ?? "Desconhecido"}</p>
        <p><strong>Tipo:</strong> {extendedProps?.tipo ?? "Desconhecido"}</p>
        <p><strong>Data:</strong> {start ? start.toLocaleDateString() : "Data inválida"}</p>
        <p><strong>Hora:</strong> {start ? start.toLocaleTimeString() : ""} - {end ? end.toLocaleTimeString() : ""}</p>

        <div className={styles.actions}>
          <div className={styles.vendaSection}>
            <input
              type="number"
              placeholder="Valor da venda"
              value={venda}
              onChange={(e) => setVenda(e.target.value)}
              className={styles.input}
            />
            <button className={styles.iconButton}>
              <Check size={20} />
            </button>
          </div>

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
