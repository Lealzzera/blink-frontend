"use client";
import styles from "./config.module.css";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import Notification from "@/components/Notification";

export default function Config() {
const [defaultDuration, setDefaultDuration] = useState(30); 
const [allowDoubleBooking, setAllowDoubleBooking] = useState(false);
const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
const [qrCodeError, setQrCodeError] = useState<string | null>(null);
const [showQrCode, setShowQrCode] = useState(false);
const [conectado, setConectado] = useState()
const [numero, setNumero] = useState()

  useEffect(() => {
      async function status(){
        const response = await fetch('https://be.blinkdentalmarketing.com.br/message/whats-app/1/status')
        const data = await response.json()
        setConectado(data.status)
        setNumero(data.connected_phone_number)
        console.log(numero)
        console.log(conectado)
    }
    status()
  }, [conectado, numero])



  const diasDaSemana = [
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
    "DOMINGO",
  ];

  const initialWorkDaysState = Object.fromEntries(
    diasDaSemana.map((_, i) => [
      i,
      {
        isWorkDay: false,
        open: "08:00",
        close: "17:00",
        breakStart: i < 5 ? "12:00" : "",
        breakEnd: i < 5 ? "13:00" : "",
      },
    ])
  );

  const [diasTrabalho, setDiasTrabalho] = useState<{
    [key: number]: {
      isWorkDay: boolean;
      open: string;
      close: string;
      breakStart: string;
      breakEnd: string;
    };
  }>(initialWorkDaysState);

  const [excecoesCadastradas, setExcecoesCadastradas] = useState<
    Array<{
      id: number;
      date: string;
      isOpen: boolean;
      start: string;
      end: string;
      lunchStart: string;
      lunchEnd: string;
    }>
  >([]);

  const [novaExcecao, setNovaExcecao] = useState({
    id: Date.now(),
    date: "",
    isOpen: false,
    start: "",
    end: "",
    lunchStart: "",
    lunchEnd: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingAppointmentConfig, setLoadingAppointmentConfig] = useState({
    duration: false,
    doubleBooking: false
  });
  const [error, setError] = useState<string | null>(null);
  const [appointmentConfigError, setAppointmentConfigError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

useEffect(() => {
  const carregarConfiguracoes = async () => {
    try {
      setInitialLoad(true);

      // Carregar dias de trabalho
      try {
        const availabilityResponse = await fetch("https://be.blinkdentalmarketing.com.br/configurations/availability/1");
        console.log('Status disponibilidade:', availabilityResponse.status);

        if (!availabilityResponse.ok) {
          throw new Error(`Erro ao carregar disponibilidade: ${availabilityResponse.status}`);
        }

        const availabilityData = await availabilityResponse.json();
        const novosDiasTrabalho = { ...initialWorkDaysState };

        if (Array.isArray(availabilityData)) {
          availabilityData.forEach((dia) => {
            const index = diasDaSemana.indexOf(dia.week_day);
            if (index !== -1) {
              novosDiasTrabalho[index] = {
                isWorkDay: dia.is_work_day,
                open: dia.open || "08:00",
                close: dia.close || "17:00",
                breakStart: index < 5 ? (dia.break_start || "12:00") : "",
                breakEnd: index < 5 ? (dia.break_end || "13:00") : "",
              };
            }
          });
        }

        setDiasTrabalho(novosDiasTrabalho);
      } catch (error) {
        console.error("Erro ao carregar disponibilidade:", error);
        setNotification({ message: "Erro ao carregar dias de trabalho.", type: "error" });
      }

      // Carregar configurações de agendamento
      try {
        const appointmentsResponse = await fetch("https://be.blinkdentalmarketing.com.br/configurations/appointments/1");
        console.log('Status appointments:', appointmentsResponse.status);

        if (!appointmentsResponse.ok) {
          throw new Error(`Erro ao carregar configurações de agendamento: ${appointmentsResponse.status}`);
        }

        const appointmentsData = await appointmentsResponse.json();
        if (appointmentsData) {
          setDefaultDuration(appointmentsData.duration || 30);
          setAllowDoubleBooking(appointmentsData.overbooking || false);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de agendamento:", error);
        setNotification({ message: "Erro ao carregar configurações de agendamento.", type: "error" });
      }

      // Carregar exceções
      try {
        const exceptionsResponse = await fetch("https://be.blinkdentalmarketing.com.br/configurations/availability/1/exception");
        console.log('Status exceptions:', exceptionsResponse.status);

        if (!exceptionsResponse.ok) {
          console.warn(`Aviso ao carregar exceções: ${exceptionsResponse.status}`);
        } else {
          const exceptionsData = await exceptionsResponse.json();
          if (Array.isArray(exceptionsData) && exceptionsData.length > 0) {
            const formattedExceptions = exceptionsData.map((ex) => ({
              id: Date.now() + Math.random(),
              date: ex.exception_day || "",
              isOpen: ex.is_working_day || false,
              start: ex.open || "",
              end: ex.close || "",
              lunchStart: ex.lunch_start_time || "",
              lunchEnd: ex.lunch_end_time || "",
            }));
            setExcecoesCadastradas(formattedExceptions);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar exceções:", error);
        setNotification({ message: "Erro ao carregar exceções.", type: "warning" });
      }

    } catch (err) {
      console.error("Erro inesperado ao carregar configurações:", err);
      setNotification({
        message: "Erro inesperado ao carregar configurações.",
        type: "error"
      });
    } finally {
      setInitialLoad(false);
    }
  };

  carregarConfiguracoes();
}, []);


  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loadingAppointmentConfig.duration) {
      timer = setTimeout(() => {
        setLoadingAppointmentConfig(prev => ({...prev, duration: false}));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [loadingAppointmentConfig.duration]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loadingAppointmentConfig.doubleBooking) {
      timer = setTimeout(() => {
        setLoadingAppointmentConfig(prev => ({...prev, doubleBooking: false}));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [loadingAppointmentConfig.doubleBooking]);

  const handleChangeDia = (index: number, field: string, value: string) => {
    setDiasTrabalho((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  };

  const toggleDiaTrabalho = (index: number) => {
    setDiasTrabalho((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        isWorkDay: !prev[index].isWorkDay,
      },
    }));
  };

  const atualizarCampoNovaExcecao = (
    campo: string,
    valor: string | boolean
  ) => {
    setNovaExcecao(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const adicionarExcecao = async () => {
    if (!novaExcecao.date) {
      setNotification({
        message: "Por favor, informe a data da exceção",
        type: "warning"
      });
      return;
    }

    try {
      setLoading(true);
      
      const excecaoParaSalvar = {
        clinic_id: 1,
        exception_day: formatDate(novaExcecao.date),
        is_working_day: novaExcecao.isOpen,
        open: novaExcecao.isOpen ? formatTime(novaExcecao.start) : null,
        close: novaExcecao.isOpen ? formatTime(novaExcecao.end) : null,
        break_start: novaExcecao.isOpen && novaExcecao.lunchStart ? formatTime(novaExcecao.lunchStart) : null,
        break_end: novaExcecao.isOpen && novaExcecao.lunchEnd ? formatTime(novaExcecao.lunchEnd) : null,
      };

      const response = await fetch("https://be.blinkdentalmarketing.com.br/configurations/availability/exception", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(excecaoParaSalvar),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      setExcecoesCadastradas(prev => [...prev, {
        ...novaExcecao,
        id: Date.now() + Math.random()
      }]);

      setNovaExcecao({
        id: Date.now(),
        date: "",
        isOpen: false,
        start: "",
        end: "",
        lunchStart: "",
        lunchEnd: "",
      });

      setNotification({
        message: "Exceção adicionada com sucesso!",
        type: "success"
      });
    } catch (err) {
      console.error("Erro ao adicionar exceção:", err);
      setNotification({
        message: "Erro ao adicionar exceção",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const validarHorarios = (dias: any[]) => {
    for (const dia of dias) {
      if (!dia.open || !dia.close) {
        return "Todos os dias de trabalho precisam ter horários de abertura e fechamento preenchidos.";
      }

      const horaAbertura = parseInt(dia.open.split(':')[0]);
      const minutoAbertura = parseInt(dia.open.split(':')[1]);
      const horaFechamento = parseInt(dia.close.split(':')[0]);
      const minutoFechamento = parseInt(dia.close.split(':')[1]);

      if (horaAbertura > horaFechamento || 
          (horaAbertura === horaFechamento && minutoAbertura >= minutoFechamento)) {
        return `Horário de fechamento deve ser após o horário de abertura no dia ${dia.week_day}`;
      }

      const index = diasDaSemana.indexOf(dia.week_day);
      if (index < 5 && dia.breakStart && dia.breakEnd) {
        const horaInicioAlmoco = parseInt(dia.breakStart.split(':')[0]);
        const minutoInicioAlmoco = parseInt(dia.breakStart.split(':')[1]);
        const horaFimAlmoco = parseInt(dia.breakEnd.split(':')[0]);
        const minutoFimAlmoco = parseInt(dia.breakEnd.split(':')[1]);

        if (horaInicioAlmoco > horaFimAlmoco || 
            (horaInicioAlmoco === horaFimAlmoco && minutoInicioAlmoco >= minutoFimAlmoco)) {
          return `Horário de fim do almoço deve ser após o horário de início no dia ${dia.week_day}`;
        }

        if (horaInicioAlmoco < horaAbertura || 
            (horaInicioAlmoco === horaAbertura && minutoInicioAlmoco < minutoAbertura)) {
          return `Horário de almoço não pode ser antes da abertura no dia ${dia.week_day}`;
        }

        if (horaFimAlmoco > horaFechamento || 
            (horaFimAlmoco === horaFechamento && minutoFimAlmoco > minutoFechamento)) {
          return `Horário de almoço não pode ser após o fechamento no dia ${dia.week_day}`;
        }
      }
    }
    return null;
  };

  const validarExcecoes = () => {
    for (const excecao of excecoesCadastradas) {
      if (excecao.isOpen) {
        if (!excecao.start || !excecao.end) {
          return "Para exceções abertas, os horários de abertura e fechamento são obrigatórios.";
        }

        const horaAbertura = parseInt(excecao.start.split(':')[0]);
        const minutoAbertura = parseInt(excecao.start.split(':')[1]);
        const horaFechamento = parseInt(excecao.end.split(':')[0]);
        const minutoFechamento = parseInt(excecao.end.split(':')[1]);

        if (horaAbertura > horaFechamento || 
            (horaAbertura === horaFechamento && minutoAbertura >= minutoFechamento)) {
          return `Horário de fechamento deve ser após o horário de abertura na exceção de ${excecao.date}`;
        }

        if (excecao.lunchStart || excecao.lunchEnd) {
          if (!excecao.lunchStart || !excecao.lunchEnd) {
            return "Se definir horário de almoço, ambos início e fim devem ser preenchidos.";
          }

          const horaInicioAlmoco = parseInt(excecao.lunchStart.split(':')[0]);
          const minutoInicioAlmoco = parseInt(excecao.lunchStart.split(':')[1]);
          const horaFimAlmoco = parseInt(excecao.lunchEnd.split(':')[0]);
          const minutoFimAlmoco = parseInt(excecao.lunchEnd.split(':')[1]);

          if (horaInicioAlmoco > horaFimAlmoco || 
              (horaInicioAlmoco === horaFimAlmoco && minutoInicioAlmoco >= minutoFimAlmoco)) {
            return `Horário de fim do almoço deve ser após o horário de início na exceção de ${excecao.date}`;
          }

          if (horaInicioAlmoco < horaAbertura || 
              (horaInicioAlmoco === horaAbertura && minutoInicioAlmoco < minutoAbertura)) {
            return `Horário de almoço não pode ser antes da abertura na exceção de ${excecao.date}`;
          }

          if (horaFimAlmoco > horaFechamento || 
              (horaFimAlmoco === horaFechamento && minutoFimAlmoco > minutoFechamento)) {
            return `Horário de almoço não pode ser após o fechamento na exceção de ${excecao.date}`;
          }
        }
      }
    }
    return null;
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatTime = (time: string | Date | null | undefined): string | null => {
    if (!time) return null;
    const date = typeof time === 'string' ? new Date(`1970-01-01T${time}`) : new Date(time);
    return date.toTimeString().slice(0, 5);
  };

  const salvarConfiguracoes = async () => {
    setLoading(true);
    setError(null);

    const todosOsDias = Object.entries(diasTrabalho).map(([index, dia]) => ({
      clinic_id: 1,
      week_day: diasDaSemana[Number(index)],
      is_work_day: dia.isWorkDay,
      open: dia.isWorkDay ? dia.open : null,
      close: dia.isWorkDay ? dia.close : null,
      break_start: dia.isWorkDay && Number(index) < 5 ? dia.breakStart : null,
      break_end: dia.isWorkDay && Number(index) < 5 ? dia.breakEnd : null,
    }));

    const diasSelecionados = todosOsDias.filter(dia => dia.is_work_day);

    if (diasSelecionados.length === 0) {
      setError("Selecione pelo menos um dia de trabalho.");
      setNotification({
        message: "Selecione pelo menos um dia de trabalho",
        type: "warning"
      });
      setLoading(false);
      return;
    }

    const erroValidacaoDias = validarHorarios(diasSelecionados);
    if (erroValidacaoDias) {
      setError(erroValidacaoDias);
      setNotification({
        message: erroValidacaoDias,
        type: "warning"
      });
      setLoading(false);
      return;
    }

    const erroValidacaoExcecoes = validarExcecoes();
    if (erroValidacaoExcecoes) {
      setError(erroValidacaoExcecoes);
      setNotification({
        message: erroValidacaoExcecoes,
        type: "warning"
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://be.blinkdentalmarketing.com.br/configurations/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(todosOsDias),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      setNotification({
        message: "Configurações salvas com sucesso!",
        type: "success",
      });
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido ao salvar configurações");
      setNotification({
        message: "Erro ao salvar configurações",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoesAgendamento = async (newDuration?: number, newAllowDoubleBooking?: boolean) => {
    try {
      if (newDuration !== undefined) {
        setLoadingAppointmentConfig(prev => ({...prev, duration: true}));
      }
      if (newAllowDoubleBooking !== undefined) {
        setLoadingAppointmentConfig(prev => ({...prev, doubleBooking: true}));
      }
      
      setAppointmentConfigError(null);

      const response = await fetch("https://be.blinkdentalmarketing.com.br/configurations/appointments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinic_id: 1,
          duration: newDuration !== undefined ? newDuration : defaultDuration,
          overbooking: newAllowDoubleBooking !== undefined ? newAllowDoubleBooking : allowDoubleBooking,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      setNotification({
        message: "Configurações de agendamento atualizadas!",
        type: "success",
      });
    } catch (err) {
      console.error("Erro ao salvar configurações de agendamento:", err);
      setAppointmentConfigError(
        err instanceof Error ? err.message : "Erro desconhecido ao salvar configurações de agendamento"
      );
      setNotification({
        message: "Erro ao atualizar configurações",
        type: "error",
      });
      
      if (newDuration !== undefined) {
        setLoadingAppointmentConfig(prev => ({...prev, duration: false}));
      }
      if (newAllowDoubleBooking !== undefined) {
        setLoadingAppointmentConfig(prev => ({...prev, doubleBooking: false}));
      }
    }
  };

  const handleShowQrCode = async () => {
    setShowQrCode(true);
    setQrCodeError(null);
    
    try {
      const response = await fetch('https://be.blinkdentalmarketing.com.br/message/whats-app/1/qr-code', {
        headers: {
          'Accept': 'image/png'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar o QR Code: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
    } catch (err) {
      console.error(err);
      setQrCodeError('Erro ao carregar o QR Code.');
    }
  };

  const handleDurationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = Number(e.target.value);
    setDefaultDuration(newDuration);
    await salvarConfiguracoesAgendamento(newDuration);
  };

  const handleDoubleBookingChange = async (checked: boolean) => {
    setAllowDoubleBooking(checked);
    await salvarConfiguracoesAgendamento(undefined, checked);
  };

  if (initialLoad) {
    return <div className={styles.container}>Carregando configurações...</div>;
  }

  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <h1 className={styles.title}>Configurações da Clínica</h1>
      {loadingAppointmentConfig.duration && <span className={styles.salvando}>Salvando...</span>}
      {loadingAppointmentConfig.doubleBooking && <span className={styles.salvando}>Salvando...</span>}

      {error && <div className={styles.errorMessage}>{error}</div>}
      {appointmentConfigError && <div className={styles.errorMessage}>{appointmentConfigError}</div>}

      <div className={styles.item}>
        <h3 className={styles.label}>Duração padrão da consulta</h3>
        <select
          id="select"
          className={styles.select}
          value={defaultDuration}
          onChange={handleDurationChange}
          disabled={loadingAppointmentConfig.duration}
        >
          <option value="30">30min</option>
          <option value="60">1h</option>
          <option value="90">1h30min</option>
          <option value="120">2h</option>
        </select>
      </div>

      <div className={styles.item}>
        <h3>Permitir agendar 2 pacientes no mesmo horário?</h3>
        <Switch
          className={styles.switch}
          checked={allowDoubleBooking}
          onCheckedChange={handleDoubleBookingChange}
          disabled={loadingAppointmentConfig.doubleBooking}
        />
      </div>

      <div className={styles.item}>
        <h3>Número conectado</h3>
        <p className={styles.number}>
          {conectado === 'DISCONNECTED' ? (
            <>
              Desconectado <span className={styles.disconnected}></span>
            </>
          ) : (
            numero
          )}
        </p>
      </div>

      <button className={styles.buttonWpp} onClick={handleShowQrCode}>
        QR Code WhatsApp
      </button>
      
      {showQrCode && (
        <div className={styles.qrCodeContainer}>
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code WhatsApp"
              className={styles.qrCodeImage}
            />
          ) : qrCodeError ? (
            <p className={styles.errorMessage}>{qrCodeError}</p>
          ) : (
            <p>Carregando QR Code...</p>
          )}
        </div>
      )}

      <hr className={styles.line}/>

      <div className={styles.availabilityTop}>
        <h2 className={styles.subtitle}>Disponibilidade da Clínica</h2>
        <button
          className={styles.saveButton}
          onClick={salvarConfiguracoes}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>

      <div className={styles.availability}>
        {diasDaSemana.map((dia, index) => (
          <div key={index} className={styles.availabilityRow}>
            <span className={styles.day}>
              {dia.charAt(0) + dia.slice(1).toLowerCase()}
            </span>

            <label className={styles.labelSmall}>
              Dia de trabalho
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={diasTrabalho[index].isWorkDay}
                onChange={() => toggleDiaTrabalho(index)}
              />
            </label>

            {diasTrabalho[index].isWorkDay && (
              <>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Abertura</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={diasTrabalho[index].open}
                    onChange={(e) =>
                      handleChangeDia(index, "open", e.target.value)
                    }
                  />
                </div>

                {index < 5 && (
                  <>
                    <div className={styles.timeInputGroup}>
                      <label className={styles.timeLabel}>Início almoço</label>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={diasTrabalho[index].breakStart}
                        onChange={(e) =>
                          handleChangeDia(index, "breakStart", e.target.value)
                        }
                      />
                    </div>

                    <div className={styles.timeInputGroup}>
                      <label className={styles.timeLabel}>Fim almoço</label>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={diasTrabalho[index].breakEnd}
                        onChange={(e) =>
                          handleChangeDia(index, "breakEnd", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Fechamento</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={diasTrabalho[index].close}
                    onChange={(e) =>
                      handleChangeDia(index, "close", e.target.value)
                    }
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <h3 className={styles.subheading}>Adicionar Nova Exceção de Funcionamento</h3>
      <div className={styles.exceptionsSection}>
        <div className={styles.exceptionRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={novaExcecao.date}
            onChange={(e) =>
              atualizarCampoNovaExcecao("date", e.target.value)
            }
          />

          <label className={styles.labelSmall}>
            Clínica abrirá neste dia?
            <input
              type="checkbox"
              checked={novaExcecao.isOpen}
              onChange={(e) =>
                atualizarCampoNovaExcecao("isOpen", e.target.checked)
              }
              className={styles.checkbox}
            />
          </label>

          {novaExcecao.isOpen && (
            <div className={styles.timeInputs}>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Abertura</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={novaExcecao.start}
                  onChange={(e) =>
                    atualizarCampoNovaExcecao("start", e.target.value)
                  }
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Fechamento</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={novaExcecao.end}
                  onChange={(e) =>
                    atualizarCampoNovaExcecao("end", e.target.value)
                  }
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Início almoço</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={novaExcecao.lunchStart}
                  onChange={(e) =>
                    atualizarCampoNovaExcecao("lunchStart", e.target.value)
                  }
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Fim almoço</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={novaExcecao.lunchEnd}
                  onChange={(e) =>
                    atualizarCampoNovaExcecao("lunchEnd", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.addButton}
            onClick={adicionarExcecao}
            disabled={loading}
          >
            Adicionar
          </button>
        </div>
      </div>

      <h3 className={styles.subheading}>Exceções Cadastradas</h3>
      <div className={styles.exceptionsSection}>
        {excecoesCadastradas.length === 0 ? (
          <p className={styles.noExceptions}>Nenhuma exceção cadastrada</p>
        ) : (
          excecoesCadastradas.map((excecao) => (
            <div className={styles.exceptionRow} key={excecao.id}>
              <div className={styles.exceptionDate}>
                {new Date(excecao.date).toLocaleDateString('pt-BR')}
              </div>

              <div className={styles.exceptionStatus}>
                {excecao.isOpen ? "Aberto" : "Fechado"}
              </div>

              {excecao.isOpen && (
                <div className={styles.exceptionTimes}>
                  <div className={styles.timeGroup}>
                    <b className={styles.timeLabel}>Abertura:</b>
                    <span> {excecao.start}</span>
                  </div>
                  <div className={styles.timeGroup}>
                    <b className={styles.timeLabel}>Fechamento:</b>
                    <span> {excecao.end}</span>
                  </div>
                  {excecao.lunchStart && excecao.lunchEnd && (
                    <>
                      <div className={styles.timeGroup}>
                        <b className={styles.timeLabel}>Almoço:</b>
                        <span> {excecao.lunchStart} - {excecao.lunchEnd}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                className={styles.removeButton}
                disabled={loading}
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}