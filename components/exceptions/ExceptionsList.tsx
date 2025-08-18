import React from 'react';
import styles from '../../app/config/config.module.css';

interface ExceptionItem {
  id: number;
  date: string;
  isOpen: boolean;
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
}

interface ExceptionsListProps {
  exceptions: ExceptionItem[];
  loading: boolean;
  onRemove: (id: number) => void;
}

export const ExceptionsList: React.FC<ExceptionsListProps> = ({
  exceptions,
  loading,
  onRemove
}) => {
  return (
    <>
      <h3 className={styles.subheading}>Exceções Cadastradas</h3>
      <div className={styles.exceptionsSection}>
        {exceptions.length === 0 ? (
          <p className={styles.noExceptions}>Nenhuma exceção cadastrada</p>
        ) : (
          exceptions.map((exception) => (
            <div className={styles.exceptionRow} key={exception.id}>
              <div className={styles.exceptionDate}>
                {new Date(exception.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </div>

              <div className={styles.exceptionStatus}>
                {exception.isOpen ? "Aberto" : "Fechado"}
              </div>

              {exception.isOpen && (
                <div className={styles.exceptionTimes}>
                  <div className={styles.timeGroup}>
                    <b className={styles.timeLabel}>Abertura:</b>
                    <span> {exception.start}</span>
                  </div>
                  <div className={styles.timeGroup}>
                    <b className={styles.timeLabel}>Fechamento:</b>
                    <span> {exception.end}</span>
                  </div>
                  {exception.lunchStart && exception.lunchEnd && (
                    <div className={styles.timeGroup}>
                      <b className={styles.timeLabel}>Almoço:</b>
                      <span> {exception.lunchStart} - {exception.lunchEnd}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className={styles.removeButton}
                onClick={() => onRemove(exception.id)}
                disabled={loading}
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
};