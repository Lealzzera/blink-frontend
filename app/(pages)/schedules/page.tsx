'use client';
import { getAppointments } from '@/app/actions/getAppointments';
import { postAppointment } from '@/app/actions/postAppointment';
import { putAppointmentStatus } from '@/app/actions/putAppointmentStatus';
import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import EventDetailsComponent from '@/app/components/EventDetailsComponent/EventDetailsComponent';
import InputComponent from '@/app/components/InputComponent/InputComponent';
import { useUser } from '@/app/context/userContext';
import { EventInput } from '@fullcalendar/core';
import ptBr from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import Calendar from '@fullcalendar/react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import styles from './style.module.css';

export default function Schedules() {
  const { clinicInfo } = useUser();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTelephone, setFormTelephone] = useState<string>('');
  const [formPatientName, setFormPatientName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formTime, setFormTime] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [dataRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [error, setError] = useState<string>('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormDate('');
    setFormTime('');
    setFormDescription('');
    setError('');
    setFormPatientName('');
    setFormTelephone('');
  };

  const handleCreate = async () => {
    if (!formTelephone || !formDate || !formTime || !formPatientName) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!clinicInfo?.clinicId) {
      setError('Não foi possível identificar a clínica. Recarregue a página e tente novamente.');
      return;
    }

    const sanitizedPhoneNumber = formTelephone.replace(/\D/g, '');
    const [day, month, year] = formDate.split('/');

    if (!day || !month || !year || year.length !== 4) {
      setError('Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    const appointmentDateInIsoFormat = `${year}-${month}-${day}`;
    const parsedAppointmentDateTime = new Date(`${appointmentDateInIsoFormat}T${formTime}:00`);

    if (isNaN(parsedAppointmentDateTime.getTime())) {
      setError('Data ou horário inválido.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await postAppointment({
        clinicId: clinicInfo.clinicId,
        customerName: formPatientName,
        customerPhoneNumber: sanitizedPhoneNumber,
        appointmentDate: appointmentDateInIsoFormat,
        time: formTime,
        notes: formDescription || undefined,
      });

      toast('Agendamento criado com sucesso.', {
        theme: 'colored',
        type: 'success',
      });

      handleCloseModal();
      await fetchAppointments();
    } catch (requestError: any) {
      const backendMessage =
        requestError?.response?.data?.message ??
        'Ocorreu um erro ao criar o agendamento. Tente novamente mais tarde.';

      toast(backendMessage, {
        theme: 'colored',
        type: 'error',
      });

      setError(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeTelephone = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const digits = inputValue.replace(/\D/g, '');

    let formatted = '';

    if (digits.length > 0) {
      formatted += '(' + digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ')' + digits.substring(2, 7);
    }
    if (digits.length >= 8) {
      formatted += '-' + digits.substring(7, 11);
    }

    setFormTelephone(formatted);
  };

  const handleChangePatientName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormPatientName(event.target.value);
  };

  const handleChangeDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const digits = inputValue.replace(/\D/g, '');

    let formatted = '';

    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += '/' + digits.substring(2, 4);
    }
    if (digits.length >= 5) {
      formatted += '/' + digits.substring(4, 8);
    }

    setFormDate(formatted);
  };

  const handleChangeTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const digits = inputValue.replace(/\D/g, '');

    let formatted = '';

    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ':' + digits.substring(2, 4);
    }

    setFormTime(formatted);
  };

  const handleFormatDateSet = (dateInfo: any) => {
    const startDateIso = new Date(dateInfo.startStr).toISOString().split('T')[0];
    const endDateIso = new Date(dateInfo.endStr).toISOString().split('T')[0];
    setDateRange({ start: startDateIso, end: endDateIso });
  };

  const handlePresenterAppointmentsList = (appointmentsData: any[]) => {
    return appointmentsData.flatMap((appointment: any) => {
      const date = appointment.date;
      return (appointment.appointments || []).map((appt: any) => {
        const time = appt.time || '00:00';
        const isoTime = `${date}T${time}`;

        return {
          id: String(appt.id),
          title: appt.patient_name,
          start: new Date(isoTime).toISOString(),
          extendedProps: {
            phone: appt.patient_phone,
            duration: appt.duration,
            status: appt.status,
            notes: appt.notes,
            dayInfo: {
              open: appointment.open,
              close: appointment.close,
              break_start: appointment.break_start,
              break_end: appointment.break_end,
            },
          },
        };
      });
    });
  };

  const fetchAppointments = useCallback(async () => {
    if (!dataRange.start) return;
    try {
      const appointments = await getAppointments({
        startDate: dataRange.start,
        endDate: dataRange.end,
      });

      if (!appointments || !Array.isArray(appointments)) {
        console.error('Appointments inválido ou não é um array:', appointments);
        return;
      }

      const appointmentsFormatted = handlePresenterAppointmentsList(appointments);

      setEvents(appointmentsFormatted);
    } catch (fetchError) {
      console.error('Erro ao buscar appointments:', fetchError);
    }
  }, [dataRange]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = useCallback(
    async (payload: { id?: string; status: string }) => {
      setSelectedEvent(null);
      await putAppointmentStatus({
        appointmentId: String(payload.id),
        status: payload.status,
      });
      await fetchAppointments();
    },
    [fetchAppointments],
  );

  return (
    <div className={styles.schedulesContainer}>
      <ToastContainer />
      <h1>Agendamentos</h1>
      <div className={styles.buttonContainer}>
        <button className={styles.newScheduleButton} onClick={handleOpenModal}>
          Novo agendamento
        </button>
        <div className={styles.legend}>
          <div>
            <div className={styles.scheduled}></div>
            <span>Agendado</span>
          </div>
          <div>
            <div className={styles.confirmed}></div>
            <span>Confirmado</span>
          </div>
          <div>
            <div className={styles.showedUp}></div>
            <span>Compareceu</span>
          </div>
          <div>
            <div className={styles.notShowedUp}></div>
            <span>Não compareceu</span>
          </div>
        </div>
      </div>
      <div className={styles.calendarContainer}>
        {selectedEvent && (
          <EventDetailsComponent
            handleUpdateStatus={(event) => handleUpdateStatus(event)}
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
        <Calendar
          datesSet={(info) => {
            handleFormatDateSet(info);
          }}
          eventClick={(info) => {
            const ev: EventInput = {
              id: info.event.id,
              title: info.event.title,
              start: info.event.start ? info.event.start.toISOString() : info.event.startStr,
              extendedProps: (info.event as any).extendedProps,
            };
            setSelectedEvent(ev);
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          plugins={[dayGridPlugin]}
          locale={ptBr}
          initialView="dayGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridWeek,dayGridMonth',
          }}
          events={events}
          eventClassNames={(arg) => {
            const status = (arg.event.extendedProps as any)?.status;
            const key = `status_${String(status || '').toUpperCase()}`;
            const statusClass = (styles as any)[key];
            return [styles.scheduleItem, statusClass].filter(Boolean) as string[];
          }}
          dayCellClassNames={(arg) => {
            if (arg.isToday) {
              return [styles.dayCellCustom];
            }
            return [];
          }}
          buttonText={{ month: 'Mês', week: 'Semana' }}
          height={'100%'}
        />
      </div>
      {isModalOpen && (
        <div className={styles.scheduleModal}>
          <div className={styles.modalContent}>
            <h2>Novo Agendamento</h2>
            <InputComponent
              label="Nome do paciente"
              placeholder="Digite o nome do paciente"
              value={formPatientName}
              handleChangeInput={handleChangePatientName}
            />
            <InputComponent
              label="Telefone"
              placeholder="(00)00000-0000"
              value={formTelephone}
              handleChangeInput={handleChangeTelephone}
            />
            <InputComponent
              label="Data"
              placeholder="DD/MM/AAAA"
              value={formDate}
              handleChangeInput={handleChangeDate}
            />
            <InputComponent
              label="Horário"
              placeholder="00:00"
              value={formTime}
              handleChangeInput={handleChangeTime}
            />
            <InputComponent
              type="text"
              value={formDescription}
              handleChangeInput={(event) => setFormDescription(event.target.value)}
              placeholder="Descrição do agendamento"
            />
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.modalButtons}>
              <ButtonComponent
                text="Cancelar"
                handleClickButton={handleCloseModal}
                style={{
                  background: 'transparent',
                  color: 'var(--red-300)',
                  border: '2px solid var(--red-300)',
                }}
              />
              <ButtonComponent
                text={isSubmitting ? 'Criando...' : 'Criar'}
                handleClickButton={handleCreate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
