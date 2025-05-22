import { useState } from "react";
import styles from "./styles/agendamento-modal.module.css";
import MessageBox from "./MessageBox";

interface Props {
  onClose: () => void;
}

export default function ModalNovoAgendamento({ onClose }: Props) {
  const [patientNumber, setPatientNumber] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [clinicId, setClinicId] = useState(1);
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState(0);

  const [messageBox, setMessageBox] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showMessage = (message: string, type: "success" | "error") => {
    setMessageBox({ message, type });
  };

  const isWithinBusinessHours = (hour: string) => {
    const [h, m] = hour.split(":").map(Number);
    const minutes = h * 60 + m;

    const start = 9 * 60;         // 09:00
    const lunchStart = 12 * 60;   // 12:00
    const lunchEnd = 13 * 60;     // 13:00
    const end = 18 * 60;          // 18:00

    const isInBusiness = minutes >= start && minutes < end;
    const isInLunchBreak = minutes >= lunchStart && minutes < lunchEnd;

    return isInBusiness && !isInLunchBreak;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedDate = new Date(`${date}T${hour}`);
    const now = new Date();

    if (selectedDate < now) {
      showMessage("Não é possível agendar em dias anteriores.", "error");
      return;
    }

    if (!isWithinBusinessHours(hour)) {
      showMessage("Horário inválido: fora do expediente ou no horário de almoço.", "error");
      return;
    }

    try {
      const scheduledDateTime = `${date} ${hour}`;

      const body = {
        patient_number: patientNumber,
        scheduled_time: scheduledDateTime,
        notes,
        clinic: clinicId,
        service_type: serviceType,
      };

      const res = await fetch("http://localhost:51234/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        showMessage("Agendamento criado com sucesso!", "success");
        onClose();
      } else if (res.status === 409) {
        showMessage("Horário já ocupado!", "error");
      } else {
        let error;
        try {
          error = await res.json();
        } catch {
          error = await res.text();
        }
        showMessage("Erro: " + JSON.stringify(error), "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Erro ao criar agendamento.", "error");
    }
  };

  return (
    <>
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onHide={() => setMessageBox(null)}
        />
      )}

      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2>Novo Agendamento</h2>
          <form onSubmit={handleSubmit}>
            <label>Número do paciente:</label>
            <input
              value={patientNumber}
              onChange={(e) => setPatientNumber(e.target.value)}
              required
            />

            <label>Data:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <label>Hora:</label>
            <input
              type="time"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              required
            />

            <label>Clínica (ID):</label>
            <input
              type="number"
              value={clinicId}
              onChange={(e) => setClinicId(Number(e.target.value))}
              required
            />

            <label>Notas:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais"
            />

            <label>Tipo de serviço (ID):</label>
            <input
              type="number"
              value={serviceType}
              onChange={(e) => setServiceType(Number(e.target.value))}
              required
            />

            <div className={styles.buttons}>
              <button type="submit">Agendar</button>
              <button type="button" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
