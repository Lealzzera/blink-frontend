import { useState, useEffect } from "react";
import styles from "./styles/agendamento-modal.module.css";
import MessageBox from "./MessageBox";
import { createClient } from "@/lib/client";
const supabase = createClient();
const API_BASE = "https://be.blinkdentalmarketing.com.br/api/v1";

interface Props {
  onClose: () => void;
  onAppointmentCreated: (newEvent: any) => void; // nova prop
}

export default function ModalNovoAgendamento({ onClose, onAppointmentCreated }: Props) {
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [clinicId, setClinicId] = useState(1);
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [messageBox, setMessageBox] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showMessage = (message: string, type: "success" | "error") => {
    setMessageBox({ message, type });
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    setRawPhone(numbers);
    if (numbers.length <= 2) return numbers.replace(/(\d{0,2})/, "($1");
    if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d{0,5})/, "($1)$2");
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1)$2-$3");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setDisabled(true);

    if (!date || !hour) {
      showMessage("Selecione data e hora válidas.", "error");
      setDisabled(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const patientPayload = { name: patientName, phone_number: rawPhone, clinic_id: clinicId };
      const pacientRes = await fetch(`${API_BASE}/patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(patientPayload),
      });
      if (pacientRes.status !== 201 && pacientRes.status !== 409) {
        showMessage("Erro ao criar paciente.", "error");
        setDisabled(false);
        return;
      }

      const appointmentPayload = {
        patient_number: rawPhone,
        scheduled_time: `${date} ${hour}`,
        notes,
        clinic: clinicId,
        service_type: serviceType,
      };

      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(appointmentPayload),
      });

      const text = await res.text();
      const responseBody = (() => { try { return JSON.parse(text); } catch { return text; } })();

      if (res.status === 201) {
        showMessage("Agendamento criado com sucesso!", "success");

        // Adiciona evento direto no calendário
        const newEvent = {
          title: patientName,
          start: `${date}T${hour}`,
          end: `${date}T${hour}`, // ajuste se precisar
          extendedProps: { id: responseBody.id },
          status: "AGENDADO"
        };
        onAppointmentCreated(newEvent);

        onClose();
      } else {
        showMessage(`Erro: ${JSON.stringify(responseBody)}`, "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Erro ao criar agendamento.", "error");
    } finally {
      setTimeout(() => setDisabled(false), 1000);
    }
  };

  return (
    <>
      {messageBox && (
        <MessageBox message={messageBox.message} type={messageBox.type} onHide={() => setMessageBox(null)} />
      )}

      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2 className={styles.title}>Novo Agendamento</h2>
          <form onSubmit={handleSubmit}>
            <label className={styles.label}>Nome do paciente:</label>
            <input className={styles.input} value={patientName} onChange={(e) => setPatientName(e.target.value)} required />

            <label className={styles.label}>Telefone:</label>
            <input className={styles.input} value={phoneNumber} onChange={handlePhoneChange} required maxLength={15} />

            <label className={styles.label}>Data:</label>
            <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />

            <label className={styles.label}>Hora:</label>
            <input className={styles.input} type="time" value={hour} onChange={(e) => setHour(e.target.value)} required />

            <label className={styles.label}>Clínica (ID):</label>
            <input className={styles.input} type="number" value={clinicId} onChange={(e) => setClinicId(Number(e.target.value))} required />

            <label className={styles.label}>Notas:</label>
            <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />

            <label className={styles.label}>Tipo de Serviço:</label>
            <input className={styles.input} type="number" value={serviceType} onChange={(e) => setServiceType(Number(e.target.value))} />

            <div className={styles.actions}>
              <button type="submit" className={styles.buttonSubmit} disabled={disabled}>Agendar</button>
              <button type="button" onClick={onClose} className={styles.buttonCancel}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
