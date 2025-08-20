import React from 'react';
import { WorkDayRow } from './WorkDayRow';
import styles from '../../app/config/config.module.css';

interface WorkDayState {
  isWorkDay: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
}

interface AvailabilitySettingsProps {
  workDays: { [key: number]: WorkDayState };
  loading: boolean;
  onToggleWorkDay: (index: number) => void;
  onChangeTime: (index: number, field: string, value: string) => void;
  onSave: () => void;
}

const DAYS_OF_WEEK = [
  "SEGUNDA",
  "TERCA", 
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
];

export const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
  workDays,
  loading,
  onToggleWorkDay,
  onChangeTime,
  onSave
}) => {
  return (
    <>
    <div className={styles.containerAvailability}>
          <div className={styles.availabilityTop}>
        <h2 className={styles.subtitle}>Disponibilidade da Clínica</h2>
        <button
          className={styles.saveButton}
          onClick={onSave}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar Disponibilidade"}
        </button>
      </div>

      <div className={styles.availability}>
        {DAYS_OF_WEEK.map((day, index) => (
          <WorkDayRow
            key={index}
            dayName={day}
            index={index}
            workDay={workDays[index]}
            onToggleWorkDay={onToggleWorkDay}
            onChangeTime={onChangeTime}
          />
        ))}
      </div>
    </div>
    </>
  );
};