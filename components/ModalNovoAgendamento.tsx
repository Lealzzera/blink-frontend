import { useState, useEffect } from "react";
import styles from "./styles/agendamento-modal.module.css";
import MessageBox from "./MessageBox";
import { createClient } from '@/lib/client'
const supabase = createClient()
const API_BASE = "https://be.blinkdentalmarketing.com.br/api/v1"

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

interface ExceptionDay {
  exception_day: string;
  is_working_day: boolean;
  open: string | null;
  close: string | null;
  break_start: string | null;
  break_end: string | null;
}

interface ClinicConfig {
  appointment_duration: number; // em minutos
  allow_overbooking: boolean;
}

export default function ModalNovoAgendamento({ onClose }: Props) {
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [clinicId, setClinicId] = useState(1);
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState(0);
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>({
    appointment_duration: 30, // valor padrão de 60 minutos
    allow_overbooking: false
  });

  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  const diasDaSemana = [
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
    "DOMINGO",
  ];

  const [messageBox, setMessageBox] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showMessage = (message: string, type: "success" | "error") => {
    setMessageBox({ message, type });
  };

  const fetchClinicConfig = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_BASE}/configurations/appointments/${clinicId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (!res.ok) throw new Error("Erro ao buscar configurações da clínica");
      const data = await res.json();
      setClinicConfig({
        appointment_duration: data.duration || 60,
        allow_overbooking: data.overbooking || false
      });
      console.log(data.duration)
    } catch (err) {
      console.error(err);
      showMessage("Erro ao buscar configurações da clínica.", "error");
    }
  };

  const fetchWorkingDays = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_BASE}/configurations/availability/${clinicId}/exception`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      
      if (!res.ok) throw new Error("Erro ao buscar dias de trabalho");
      const data = await res.json();
      setWorkingDays(data);
    } catch (err) {
      console.error(err);
      showMessage("Erro ao buscar dias de trabalho.", "error");
    }
  };

  const convertToMinutes = (time: string) => {
    const [hour, min] = time.split(":").map(Number);
    return hour * 60 + min;
  };

  const convertMinutesToTime = (minutes: number) => {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const min = String(minutes % 60).padStart(2, "0");
    return `${hour}:${min}`;
  };

  const generateTimeOptions = (
    open: string,
    close: string,
    breakStart: string,
    breakEnd: string,
    appointmentDuration: number
  ) => {
    const options: string[] = [];
    const openMinutes = convertToMinutes(open);
    const closeMinutes = convertToMinutes(close);
    const breakStartMinutes = convertToMinutes(breakStart);
    const breakEndMinutes = convertToMinutes(breakEnd);
    const durationMinutes = appointmentDuration;

    for (let minutes = openMinutes; minutes <= closeMinutes - durationMinutes; minutes += 15) {
      // Verifica se o horário está dentro do intervalo de almoço
      if (minutes >= breakStartMinutes && minutes < breakEndMinutes) continue;
      
      // Verifica se a consulta ultrapassa o horário de almoço
      if (minutes < breakStartMinutes && (minutes + durationMinutes) > breakStartMinutes) continue;
      
      // Verifica se a consulta ultrapassa o horário de fechamento
      if ((minutes + durationMinutes) > closeMinutes) continue;
      
      const timeStr = convertMinutesToTime(minutes);
      options.push(timeStr);
    }

    return options;
  };

  const checkExceptionAndGenerateOptions = async (selectedDate: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Buscar exceções
      const exceptionsRes = await fetch(`${API_BASE}/configurations/availability/${clinicId}/exception`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      
      if (!exceptionsRes.ok) throw new Error("Erro ao buscar exceções");
      const exceptions: ExceptionDay[] = await exceptionsRes.json();

      // Verificar se há exceção para esta data
      const exception = exceptions.find((e) => e.exception_day === selectedDate);

      if (exception) {
        if (!exception.is_working_day) {
          setAvailableHours([]);
          showMessage("A clínica estará fechada neste dia por exceção.", "error");
          return;
        }

        if (exception.open && exception.close) {
          const options = generateTimeOptions(
            exception.open,
            exception.close,
            exception.break_start || "12:00",
            exception.break_end || "13:00",
            clinicConfig.appointment_duration
          );
          setAvailableHours(options);
          return;
        }
      }

      // Se não houver exceção, usar horários padrão baseados no dia da semana
      const dateObj = new Date(selectedDate);
      const dayOfWeek = dateObj.getDay(); // 0=Domingo, 1=Segunda, etc.
      
      // Ajuste para corresponder ao seu array diasDaSemana (SEGUNDA=0)
      const workingDaysRes = await fetch(`${API_BASE}/configurations/availability/${clinicId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (!workingDaysRes.ok) throw new Error("Erro ao buscar dias de trabalho");
      const workingDays: any[] = await workingDaysRes.json();

      const defaultDay = workingDays.find(d => d.week_day === diasDaSemana[dayOfWeek]);
      
      if (defaultDay && defaultDay.is_work_day) {
        const options = generateTimeOptions(
          defaultDay.open || "08:00",
          defaultDay.close || "17:00",
          defaultDay.break_start || "12:00",
          defaultDay.break_end || "13:00",
          clinicConfig.appointment_duration
        );
        setAvailableHours(options);
      } else {
        setAvailableHours([]);
        showMessage("A clínica não funciona neste dia da semana.", "error");
      }
    } catch (error) {
      console.error(error);
      showMessage("Erro ao processar horários disponíveis.", "error");
      setAvailableHours([]);
    }
  };

  useEffect(() => {
    fetchWorkingDays();
    fetchClinicConfig();
  }, [clinicId]);

  useEffect(() => {
    if (date) {
      checkExceptionAndGenerateOptions(date);
      setHour(""); // reseta hora se trocar a data
    }
  }, [date, clinicId, clinicConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !hour) {
      showMessage("Selecione data e hora válidas.", "error");
      return;
    }

    const selectedDate = new Date(`${date}T${hour}`);
    if (selectedDate < new Date()) {
      showMessage("Não é possível agendar em datas passadas.", "error");
      return;
    }

    try {
      const patientPayload = {
        name: patientName,
        phone_number: phoneNumber,
        clinic_id: clinicId,
      };

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const pacientRes = await fetch(`${API_BASE}/patient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(patientPayload),
      })

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

      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentPayload),
      })

      const text = await res.text();
      let responseBody;
      try { responseBody = JSON.parse(text); } catch { responseBody = text; }

      if (res.status === 201) {
        showMessage("Agendamento criado com sucesso!", "success");
        onClose();
      } else if (res.status === 409) {
        if (clinicConfig.allow_overbooking) {
          // Se overbooking estiver permitido, perguntar se quer continuar
          if (window.confirm("Horário já ocupado! Deseja fazer overbooking?")) {
            const overbookingRes = await fetch(`${API_BASE}/appointments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...appointmentPayload,
                is_overbooking: true
              }),
            });
            
            if (overbookingRes.ok) {
              showMessage("Agendamento com overbooking criado com sucesso!", "success");
              onClose();
            } else {
              showMessage("Erro ao criar agendamento com overbooking.", "error");
            }
          }
        } else {
          showMessage("Horário já ocupado! Verifique se o overbooking está habilitado.", "error");
        }
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