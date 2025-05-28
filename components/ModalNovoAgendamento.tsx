import { useState } from "react";
import styles from "./styles/agendamento-modal.module.css";
import MessageBox from "./MessageBox";

interface Props {
  onClose: () => void;
}

const generateQuarterHourOptions = () => {
  const options = [];
  for (let hour = 9; hour < 18; hour++) {
    // Excluir intervalo 12:00-13:00
    if (hour === 12) continue;

    for (let min = 0; min < 60; min += 15) {
      const hStr = hour.toString().padStart(2, "0");
      const mStr = min.toString().padStart(2, "0");
      options.push(`${hStr}:${mStr}`);
    }
  }
  return options;
};

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
    return minutes >= 540 && minutes < 1080 && !(minutes >= 720 && minutes < 780); // 9:00-18:00 excluindo 12:00-13:00
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedDate = new Date(`${date}T${hour}`);
    if (selectedDate < new Date()) {
      showMessage("Não é possível agendar em dias anteriores.", "error");
      return;
    }

    if (!isWithinBusinessHours(hour)) {
      showMessage("Horário inválido: fora do expediente ou no horário de almoço.", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:51234/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_number: patientNumber,
          scheduled_time: `${date} ${hour}`,
          notes,
          clinic: clinicId,
          service_type: serviceType,
        }),
      });

      const text = await res.text();
      const responseBody = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })();

      if (res.status === 201) {
        showMessage("Agendamento criado com sucesso!", "success");
        onClose();
      } else if (res.status === 409) {
        showMessage("Horário já ocupado!", "error");
      } else {
        showMessage(`Erro inesperado: ${JSON.stringify(responseBody)}`, "error");
      }
    } catch (err) {
      console.error("Erro ao fazer requisição:", err);
      showMessage("Erro ao criar agendamento. Veja o console para detalhes.", "error");
    }
  };

  const quarterHourOptions = generateQuarterHourOptions();

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
          <h2 className={styles.title}><strong>Novo Agendamento</strong></h2>
          <form onSubmit={handleSubmit}>
            <label className={styles.label}>Número do paciente:</label>
            <input
              className={styles.input}
              value={patientNumber}
              onChange={(e) => setPatientNumber(e.target.value)}
              required
            />

            <label className={styles.label}>Data:</label>
            <input
              className={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <label className={styles.label}>Hora:</label>
            <select
              className={styles.select}
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              required
            >
              <option value="">Selecione um horário</option>
              {quarterHourOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <label className={styles.label}>Clínica (ID):</label>
            <input
              className={styles.input}
              type="number"
              value={clinicId}
              onChange={(e) => setClinicId(Number(e.target.value))}
              required
            />

            <label className={styles.label}>Notas:</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <label className={styles.label}>Tipo de Serviço:</label>
            <input
              className={styles.input}
              type="number"
              value={serviceType}
              onChange={(e) => setServiceType(Number(e.target.value))}
            />

            <div className={styles.actions}>
              <button type="submit" className={styles.buttonSubmit}>Agendar</button>
              <button type="button" onClick={onClose} className={styles.buttonCancel}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
