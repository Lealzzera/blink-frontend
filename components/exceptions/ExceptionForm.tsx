import React from 'react';
import styles from '../../app/config/config.module.css';

interface ExceptionFormData {
  date: string;
  isOpen: boolean;
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
}

interface ExceptionFormProps {
  exception: ExceptionFormData;
  loading: boolean;
  onUpdateField: (field: string, value: string | boolean) => void;
  onAdd: () => void;
}

export const ExceptionForm: React.FC<ExceptionFormProps> = ({
  exception,
  loading,
  onUpdateField,
  onAdd
}) => {
  return (
    <>
      <h3 className={styles.subheading}>Adicionar Nova Exceção de Funcionamento</h3>
      <div className={styles.exceptionsSection}>
        <div className={styles.exceptionRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={exception.date}
            onChange={(e) => onUpdateField("date", e.target.value)}
          />

          <label className={styles.labelSmall}>
            Clínica abrirá neste dia?
            <input
              type="checkbox"
              checked={exception.isOpen}
              onChange={(e) => onUpdateField("isOpen", e.target.checked)}
              className={styles.checkbox}
            />
          </label>

          {exception.isOpen && (
            <div className={styles.timeInputs}>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Abertura</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={exception.start}
                  onChange={(e) => onUpdateField("start", e.target.value)}
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Fechamento</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={exception.end}
                  onChange={(e) => onUpdateField("end", e.target.value)}
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Início almoço</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={exception.lunchStart}
                  onChange={(e) => onUpdateField("lunchStart", e.target.value)}
                />
              </div>

              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>Fim almoço</label>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={exception.lunchEnd}
                  onChange={(e) => onUpdateField("lunchEnd", e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.addButton}
            onClick={onAdd}
            disabled={loading}
          >
            Adicionar
          </button>
        </div>
      </div>
    </>
  );
};