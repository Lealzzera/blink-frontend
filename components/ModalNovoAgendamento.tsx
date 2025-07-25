import { useState, useEffect } from "react";
import styles from "./styles/agendamento-modal.module.css";
import MessageBox from "./MessageBox";

interface Props {
  onClose: () => void;
}

interface WorkingDay {
  date: string;
  open: string;
  close: string;
  break_start: string;
  break_end: string;
}

export default function ModalNovoAgendamento({ onClose }: Props) {
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [clinicId, setClinicId] = useState(1);
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState(0);

  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  const [messageBox, setMessageBox] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showMessage = (message: string, type: "success" | "error") => {
    setMessageBox({ message, type });
  };

  const fetchWorkingDays = async () => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const res = await fetch(`https://be.blinkdentalmarketing.com.br/appointments/availability?start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) throw new Error("Erro ao buscar dias de trabalho");
      const data = await res.json();
      setWorkingDays(data);
    } catch (err) {
      console.error(err);
      showMessage("Erro ao buscar dias de trabalho.", "error");
    }
  };

  const generateOptionsForDate = (selectedDate: string) => {
    const day = workingDays.find(d => d.date === selectedDate);
    if (!day) return [];

    const options: string[] = [];
    const openParts = day.open.split(":").map(Number);
    const closeParts = day.close.split(":").map(Number);
    const breakStartParts = day.break_start.split(":").map(Number);
    const breakEndParts = day.break_end.split(":").map(Number);

    const openMinutes = openParts[0] * 60 + openParts[1];
    const closeMinutes = closeParts[0] * 60 + closeParts[1];
    const breakStartMinutes = breakStartParts[0] * 60 + breakStartParts[1];
    const breakEndMinutes = breakEndParts[0] * 60 + breakEndParts[1];

    for (let minutes = openMinutes; minutes < closeMinutes; minutes += 15) {
      if (minutes >= breakStartMinutes && minutes < breakEndMinutes) continue;
      const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
      const min = String(minutes % 60).padStart(2, "0");
      options.push(`${hour}:${min}`);
    }

    return options;
  };

  useEffect(() => {
    async function disponibilidade(){
        try{
          const response = await fetch('https://be.blinkdentalmarketing.com.br/configurations/appointments/1')
          const data = await response.json()
          console.log("Aqui!", data)
        }catch(e){
          console.error(e)
        } 
    }
    disponibilidade()
  }, [])

  useEffect(() => {
    fetchWorkingDays();
  }, []);

  useEffect(() => {
    if (date) {
      const filtered = generateOptionsForDate(date);
      setAvailableHours(filtered);
      setHour(""); // reseta hora se trocar a data
    }
  }, [date, workingDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showMessage("Selecione uma data válida.", "error");
      return;
    }

    const selectedDate = new Date(`${date}T${hour}`);
    if (selectedDate < new Date()) {
      showMessage("Não é possível agendar em dias anteriores.", "error");
      return;
    }

    try {
      const patientPayload = {
        name: patientName,
        phone_number: phoneNumber,
        clinic_id: clinicId,
      };

      const pacientRes = await fetch("https://be.blinkdentalmarketing.com.br/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientPayload),
      });

      if (pacientRes.status !== 201 && pacientRes.status !== 409) {
        const text = await pacientRes.text();
        showMessage(`Erro ao criar paciente: ${text}`, "error");
        return;
      }

      const appointmentPayload = {
        patient_number: phoneNumber,
        scheduled_time: `${date} ${hour}`,
        notes,
        clinic: clinicId,
        service_type: serviceType,
      };

      const res = await fetch("https://be.blinkdentalmarketing.com.br/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentPayload),
      });

      const text = await res.text();
      let responseBody;
      try { responseBody = JSON.parse(text); } catch { responseBody = text; }

      if (res.status === 201) {
        showMessage("Agendamento criado com sucesso!", "success");
        onClose();
      } else if (res.status === 409) {
        showMessage("Horário já ocupado! Verifique se o overbooking está habilitado.", "error"); // Aqui esta atrapalhando o overbooking! Se estiver ligado, permite 2 agendamentos no mesmo hor.
      } else {
        showMessage(`Erro inesperado: ${JSON.stringify(responseBody)}`, "error");
      }
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
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
          <h2 className={styles.title}>Novo Agendamento</h2>
          <form onSubmit={handleSubmit}>
            <label className={styles.label}>Nome do paciente:</label>
            <input
              className={styles.input}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />

            <label className={styles.label}>Telefone:</label>
            <input
              className={styles.input}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />

            <label className={styles.label}>Data:</label>
            <input
              className={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
            />

            <label className={styles.label}>Hora:</label>
            <select
              className={styles.select}
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              required
              disabled={!date || availableHours.length === 0}
            >
              <option value="">Selecione um horário</option>
              {availableHours.map((time) => (
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
