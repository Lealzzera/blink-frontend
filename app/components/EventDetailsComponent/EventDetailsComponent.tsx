'use client';
import { AppointmentStatus } from '@/app/types/types';
import { EventInput } from '@fullcalendar/core';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import ButtonComponent from '../ButtonComponent/ButtonComponent';
import { TextAreaComponent } from '../TextAreaComponent/TextAreaComponent';
import styles from './style.module.css';

const APPOINTMENT_STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Agendado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'COMPLETED', label: 'Compareceu' },
  { value: 'CANCELED_BY_PATIENT', label: 'Cancelado pelo paciente' },
  { value: 'CANCELED_BY_CLINIC', label: 'Cancelado pela clínica' },
];

type EventDetailsComponentProps = {
  event: EventInput;
  onClose: () => void;
  handleUpdateAppointment: (payload: {
    appointmentId: string;
    status: AppointmentStatus;
    notes: string | null;
  }) => void;
  handleDeleteAppointment: (appointmentId: string) => void;
};

export default function EventDetailsComponent({
  event,
  onClose,
  handleUpdateAppointment,
  handleDeleteAppointment,
}: EventDetailsComponentProps) {
  const currentAppointmentStatus = event.extendedProps?.status as AppointmentStatus | undefined;

  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | ''>(
    currentAppointmentStatus ?? '',
  );
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(event.extendedProps?.notes ?? '');

  useEffect(() => {
    setSelectedStatus(currentAppointmentStatus ?? '');
    setNotesText(event.extendedProps?.notes ?? '');
    setIsEditingNotes(false);
  }, [currentAppointmentStatus, event.extendedProps?.notes, event.id]);

  const handleChangeStatus = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(changeEvent.target.value as AppointmentStatus);
  };

  const handleConfirmUpdate = () => {
    if (!event.id || !selectedStatus) return;
    handleUpdateAppointment({
      appointmentId: event.id,
      status: selectedStatus,
      notes: notesText.trim() || null,
    });
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const handleConfirmDelete = () => {
    if (!event.id) return;
    const userConfirmed = window.confirm(
      'Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.',
    );
    if (!userConfirmed) return;
    handleDeleteAppointment(event.id);
  };

  const formatAppointmentDateTime = () => {
    return new Date(event.start as string).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.modalDetailsBg}>
      <div className={styles.modalContent}>
        <h3>Detalhes do agendamento</h3>
        <p>
          Paciente: <span>{event.title}</span>
        </p>
        <p>
          Telefone: <span>{event.extendedProps?.phone}</span>
        </p>
        <p>
          Data: <span>{formatAppointmentDateTime()}</span>
        </p>
        <div className={styles.notesContainer}>
          <div className={styles.notesHeader}>
            <p>Anotações:</p>
            <p className={styles.editButton}>
              <Pencil width={16} onClick={handleEditNotes} />
            </p>
          </div>
          {isEditingNotes ? (
            <TextAreaComponent
              value={notesText}
              onChange={setNotesText}
              name="notes"
              id="notes"
              rows={2}
            />
          ) : (
            <p className={styles.notesText}>{event.extendedProps?.notes ?? '—'}</p>
          )}
        </div>
        <div className={styles.selectStatusContainer}>
          <select
            value={selectedStatus}
            onChange={handleChangeStatus}
            className={styles.selectStatus}
          >
            <option disabled value="">
              Selecione um status
            </option>
            {APPOINTMENT_STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.modalButtons}>
          <ButtonComponent
            text="Fechar"
            handleClickButton={onClose}
            style={{
              background: 'transparent',
              color: 'var(--red-300)',
              fontWeight: '600',
            }}
          />
          <ButtonComponent
            text="Excluir"
            handleClickButton={handleConfirmDelete}
            style={{
              background: 'var(--red-300)',
              color: 'var(--white)',
            }}
          />
          <ButtonComponent text="Atualizar" handleClickButton={handleConfirmUpdate} />
        </div>
      </div>
    </div>
  );
}
