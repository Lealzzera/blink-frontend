import React from 'react';
import styles from '../../app/config/config.module.css';

interface WorkDayRowProps {
  dayName: string;
  index: number;
  workDay: {
    isWorkDay: boolean;
    open: string;
    close: string;
    breakStart: string;
    breakEnd: string;
  };
  onToggleWorkDay: (index: number) => void;
  onChangeTime: (index: number, field: string, value: string) => void;
}

export const WorkDayRow: React.FC<WorkDayRowProps> = ({
  dayName,
  index,
  workDay,
  onToggleWorkDay,
  onChangeTime
}) => {
  return (
    <div className={styles.availabilityRow}>
      <span className={styles.day}>
        {dayName.charAt(0) + dayName.slice(1).toLowerCase()}
      </span>

      <label className={styles.labelSmall}>
        Dia de trabalho
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={workDay.isWorkDay}
          onChange={() => onToggleWorkDay(index)}
        />
      </label>

      {workDay.isWorkDay && (
        <>
          <div className={styles.timeInputGroup}>
            <label className={styles.timeLabel}>Abertura</label>
            <input
              type="time"
              className={styles.timeInput}
              value={workDay.open}
              onChange={(e) => onChangeTime(index, "open", e.target.value)}
            />
          </div>

          {index < 5 && (
            <>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Início almoço</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={workDay.breakStart}
                  onChange={(e) => onChangeTime(index, "breakStart", e.target.value)}
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Fim almoço</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={workDay.breakEnd}
                  onChange={(e) => onChangeTime(index, "breakEnd", e.target.value)}
                />
              </div>
            </>
          )}

          <div className={styles.timeInputGroup}>
            <label className={styles.timeLabel}>Fechamento</label>
            <input
              type="time"
              className={styles.timeInput}
              value={workDay.close}
              onChange={(e) => onChangeTime(index, "close", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};