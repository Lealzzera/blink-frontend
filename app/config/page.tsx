"use client";
import React, { useState, useEffect } from 'react';
import styles from './config.module.css';
import Notification from '@/components/Notification';
import { AppointmentSettings } from '../../components/appointments/AppointmentSettings';
import { WhatsAppStatus } from '../../components/whatsapp/WhatsAppStatus';
import { AvailabilitySettings } from '../../components/availability/AvailabilitySettings';
import { ExceptionForm } from '../../components/exceptions/ExceptionForm';
import { ExceptionsList } from '../../components/exceptions/ExceptionsList';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { whatsappService } from '../services/whatsappService';
import { appointmentService } from '../services/appointmentService';
import { availabilityService } from '../services/availabilityService';
import { exceptionService } from '../services/exceptionService';
import { formatDate, formatTime } from '../utils/dateUtils';
import { validateWorkDays, validateExceptions } from '../utils/validationUtils';

const DAYS_OF_WEEK = [
  "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"
];

const initialWorkDaysState = Object.fromEntries(
  DAYS_OF_WEEK.map((_, i) => [
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

export default function Config() {
  // Authentication
  const { getAuthToken } = useAuth();
  const { notification, showNotification, hideNotification } = useNotification();

  // Appointment settings
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [allowDoubleBooking, setAllowDoubleBooking] = useState(false);
  const [loadingAppointmentConfig, setLoadingAppointmentConfig] = useState({
    duration: false,
    doubleBooking: false
  });

  // WhatsApp settings
  const [whatsappStatus, setWhatsappStatus] = useState<string>();
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);

  // Availability settings
  const [workDays, setWorkDays] = useState(initialWorkDaysState);

  // Exceptions
  const [exceptions, setExceptions] = useState<Array<{
    id: number;
    date: string;
    isOpen: boolean;
    start: string;
    end: string;
    lunchStart: string;
    lunchEnd: string;
  }>>([]);

  const [newException, setNewException] = useState({
    id: Date.now(),
    date: "",
    isOpen: false,
    start: "",
    end: "",
    lunchStart: "",
    lunchEnd: "",
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentConfigError, setAppointmentConfigError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setInitialLoad(true);
        const token = await getAuthToken();

        // Load WhatsApp status
        try {
          const whatsappData = await whatsappService.getStatus(token);
          setWhatsappStatus(whatsappData.status);
          setPhoneNumber(whatsappData.connected_phone_number);
        } catch (error) {
          console.error("Erro ao carregar status do WhatsApp:", error);
          showNotification("Erro ao carregar status do WhatsApp", "error");
        }

        // Load availability
        try {
          const availabilityData = await availabilityService.getAvailability(token);
          const newWorkDays = { ...initialWorkDaysState };

          if (Array.isArray(availabilityData)) {
            availabilityData.forEach((day) => {
              const index = DAYS_OF_WEEK.indexOf(day.week_day);
              if (index !== -1) {
                newWorkDays[index] = {
                  isWorkDay: day.is_work_day,
                  open: day.open || "08:00",
                  close: day.close || "17:00",
                  breakStart: index < 5 ? (day.break_start || "12:00") : "",
                  breakEnd: index < 5 ? (day.break_end || "13:00") : "",
                };
              }
            });
          }

          setWorkDays(newWorkDays);
        } catch (error) {
          console.error("Erro ao carregar disponibilidade:", error);
          showNotification("Erro ao carregar dias de trabalho.", "error");
        }

        // Load appointment settings
        try {
          const appointmentData = await appointmentService.getConfig(token);
          setDefaultDuration(appointmentData.duration || 30);
          setAllowDoubleBooking(appointmentData.overbooking || false);
        } catch (error) {
          console.error("Erro ao carregar configurações de agendamento:", error);
          showNotification("Erro ao carregar configurações de agendamento.", "error");
        }

        // Load exceptions
        try {
          const exceptionsData = await exceptionService.getExceptions(token);
          if (exceptionsData.length > 0) {
            const formattedExceptions = exceptionsData.map((ex) => ({
              id: ex.id,
              date: ex.exception_day || "",
              isOpen: ex.is_working_day || false,
              start: ex.open || "",
              end: ex.close || "",
              lunchStart: ex.lunch_start_time || "",
              lunchEnd: ex.lunch_end_time || "",
            }));
            setExceptions(formattedExceptions);
          }
        } catch (error) {
          console.error("Erro ao carregar exceções:", error);
          showNotification("Erro ao carregar exceções.", "warning");
        }

      } catch (err) {
        console.error("Erro inesperado ao carregar configurações:", err);
        showNotification("Erro inesperado ao carregar configurações.", "error");
      } finally {
        setInitialLoad(false);
      }
    };

    loadConfigurations();
  }, []);

  // Auto-hide loading states
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

  // Handlers
  const handleChangeWorkDay = (index: number, field: string, value: string) => {
    setWorkDays((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  };

  const handleToggleWorkDay = (index: number) => {
    setWorkDays((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        isWorkDay: !prev[index].isWorkDay,
      },
    }));
  };

  const handleUpdateExceptionField = (field: string, value: string | boolean) => {
    setNewException(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddException = async () => {
    if (!newException.date) {
      showNotification("Por favor, informe a data da exceção", "warning");
      return;
    }

    try {
      setLoading(true);
      
      const exceptionData = {
        clinic_id: 1,
        exception_day: formatDate(newException.date),
        is_working_day: newException.isOpen,
        open: newException.isOpen ? formatTime(newException.start) : null,
        close: newException.isOpen ? formatTime(newException.end) : null,
        break_start: newException.isOpen && newException.lunchStart ? formatTime(newException.lunchStart) : null,
        break_end: newException.isOpen && newException.lunchEnd ? formatTime(newException.lunchEnd) : null,
      };

      const token = await getAuthToken();
      const responseData = await exceptionService.createException(token, exceptionData);
      
      setExceptions(prev => [...prev, {
        ...newException,
        id: responseData.id
      }]);

      setNewException({
        id: Date.now(),
        date: "",
        isOpen: false,
        start: "",
        end: "",
        lunchStart: "",
        lunchEnd: "",
      });

      showNotification("Exceção adicionada com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao adicionar exceção:", err);
      showNotification("Exceção adicionada com sucesso!", "success");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveException = async (id: number) => {
    try {
      setLoading(true);
      
      const token = await getAuthToken();
      await exceptionService.deleteException(token, id);

      setExceptions(prev => prev.filter(ex => ex.id !== id));
      showNotification("Exceção removida com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao remover exceção:", err);
      if (err instanceof Error && err.message.includes('autenticação')) {
        showNotification("Erro de autenticação. Faça login novamente.", "error");
      } else {
        showNotification("Erro ao remover exceção", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    setLoading(true);
    setError(null);

    const allDays = Object.entries(workDays).map(([index, day]) => ({
      clinic_id: 1,
      week_day: DAYS_OF_WEEK[Number(index)],
      is_work_day: day.isWorkDay,
      open: day.isWorkDay ? day.open : null,
      close: day.isWorkDay ? day.close : null,
      break_start: day.isWorkDay && Number(index) < 5 ? day.breakStart : null,
      break_end: day.isWorkDay && Number(index) < 5 ? day.breakEnd : null,
    }));

    const selectedDays = allDays.filter(day => day.is_work_day);

    if (selectedDays.length === 0) {
      setError("Selecione pelo menos um dia de trabalho.");
      showNotification("Selecione pelo menos um dia de trabalho", "warning");
      setLoading(false);
      return;
    }

    const daysValidationError = validateWorkDays(selectedDays);
    if (daysValidationError) {
      setError(daysValidationError);
      showNotification(daysValidationError, "warning");
      setLoading(false);
      return;
    }

    const exceptionsValidationError = validateExceptions(exceptions);
    if (exceptionsValidationError) {
      setError(exceptionsValidationError);
      showNotification(exceptionsValidationError, "warning");
      setLoading(false);
      return;
    }

    try {
      const token = await getAuthToken();
      await availabilityService.updateAvailability(token, allDays);
      showNotification("Configurações salvas com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido ao salvar configurações");
      showNotification("Erro ao salvar configurações", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppointmentConfig = async (newDuration?: number, newAllowDoubleBooking?: boolean) => {
    try {
      if (newDuration !== undefined) {
        setLoadingAppointmentConfig(prev => ({...prev, duration: true}));
      }
      if (newAllowDoubleBooking !== undefined) {
        setLoadingAppointmentConfig(prev => ({...prev, doubleBooking: true}));
      }
      
      setAppointmentConfigError(null);

      const token = await getAuthToken();
      await appointmentService.updateConfig(token, {
        clinic_id: 1,
        duration: newDuration !== undefined ? newDuration : defaultDuration,
        overbooking: newAllowDoubleBooking !== undefined ? newAllowDoubleBooking : allowDoubleBooking,
      });

      showNotification("Configurações de agendamento atualizadas!", "success");
    } catch (err) {
      console.error("Erro ao salvar configurações de agendamento:", err);
      setAppointmentConfigError(
        err instanceof Error ? err.message : "Erro desconhecido ao salvar configurações de agendamento"
      );
      showNotification("Erro ao atualizar configurações", "error");
      
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
      const token = await getAuthToken();
      const blob = await whatsappService.getQrCode(token);
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
    await handleSaveAppointmentConfig(newDuration);
  };

  const handleDoubleBookingChange = async (checked: boolean) => {
    setAllowDoubleBooking(checked);
    await handleSaveAppointmentConfig(undefined, checked);
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
          onClose={hideNotification}
        />
      )}

      <h1 className={styles.title}>Configurações da Clínica</h1>
      {loadingAppointmentConfig.duration && <span className={styles.salvando}>Salvando...</span>}
      {loadingAppointmentConfig.doubleBooking && <span className={styles.salvando}>Salvando...</span>}

      {error && <div className={styles.errorMessage}>{error}</div>}
      {appointmentConfigError && <div className={styles.errorMessage}>{appointmentConfigError}</div>}

      <AppointmentSettings
        defaultDuration={defaultDuration}
        allowDoubleBooking={allowDoubleBooking}
        loadingConfig={loadingAppointmentConfig}
        onDurationChange={handleDurationChange}
        onDoubleBookingChange={handleDoubleBookingChange}
      />

      <WhatsAppStatus
        status={whatsappStatus}
        phoneNumber={phoneNumber}
        onShowQrCode={handleShowQrCode}
        showQrCode={showQrCode}
        qrCodeUrl={qrCodeUrl}
        qrCodeError={qrCodeError}
      />

      <hr className={styles.line}/>

      <AvailabilitySettings
        workDays={workDays}
        loading={loading}
        onToggleWorkDay={handleToggleWorkDay}
        onChangeTime={handleChangeWorkDay}
        onSave={handleSaveAvailability}
      />

      <ExceptionForm
        exception={newException}
        loading={loading}
        onUpdateField={handleUpdateExceptionField}
        onAdd={handleAddException}
      />

      <ExceptionsList
        exceptions={exceptions}
        loading={loading}
        onRemove={handleRemoveException}
      />
    </div>
  );
}