import React from 'react';
import { Switch } from '../ui/switch';
import styles from '../../app/config/config.module.css';

interface AppointmentSettingsProps {
  defaultDuration: number;
  allowDoubleBooking: boolean;
  loadingConfig: {
    duration: boolean;
    doubleBooking: boolean;
  };
  onDurationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDoubleBookingChange: (checked: boolean) => void;
}

export const AppointmentSettings: React.FC<AppointmentSettingsProps> = ({
  defaultDuration,
  allowDoubleBooking,
  loadingConfig,
  onDurationChange,
  onDoubleBookingChange
}) => {
  return (
    <>
      <div className={styles.item}>
        <h3 className={styles.label}>Duração padrão da consulta</h3>
        <select
          id="select"
          className={styles.select}
          value={defaultDuration}
          onChange={onDurationChange}
          disabled={loadingConfig.duration}
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
          onCheckedChange={onDoubleBookingChange}
          disabled={loadingConfig.doubleBooking}
        />
      </div>
    </>
  );
};