'use client';

import InputComponent from '@/app/components/InputComponent/InputComponent';
import SwitchComponent from '@/app/components/SwitchComponent/SwitchComponent';
import styles from './styles.module.css';

export type WorkingHour = {
  weekday: string;
  startTime: string;
  endTime: string;
};

type DayConfig = {
  weekday: string;
  label: string;
  enabled: boolean;
  periods: { startTime: string; endTime: string }[];
};

type RegisterClinicWorkingHoursProps = {
  workingHours: WorkingHour[];
  setWorkingHours: (value: WorkingHour[]) => void;
};

const WEEK_DAYS = [
  { weekday: 'MONDAY', label: 'Segunda-feira' },
  { weekday: 'TUESDAY', label: 'Terça-feira' },
  { weekday: 'WEDNESDAY', label: 'Quarta-feira' },
  { weekday: 'THURSDAY', label: 'Quinta-feira' },
  { weekday: 'FRIDAY', label: 'Sexta-feira' },
  { weekday: 'SATURDAY', label: 'Sábado' },
  { weekday: 'SUNDAY', label: 'Domingo' },
];

const DEFAULT_PERIODS = [
  { startTime: '08:00', endTime: '12:00' },
  { startTime: '13:00', endTime: '18:00' },
];

function buildDayConfigs(workingHours: WorkingHour[]): DayConfig[] {
  return WEEK_DAYS.map(({ weekday, label }) => {
    const dayHours = workingHours.filter((wh) => wh.weekday === weekday);
    const enabled = dayHours.length > 0;
    const periods =
      dayHours.length > 0
        ? dayHours.map((wh) => ({ startTime: wh.startTime, endTime: wh.endTime }))
        : [{ startTime: '08:00', endTime: '18:00' }];
    return { weekday, label, enabled, periods };
  });
}

function buildWorkingHours(dayConfigs: DayConfig[]): WorkingHour[] {
  return dayConfigs
    .filter((d) => d.enabled)
    .flatMap((d) =>
      d.periods.map((p) => ({
        weekday: d.weekday,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
    );
}

const formatTimeValue = (value: string) => {
  const digits = value.replace(/\D/g, '');
  let formatted = '';
  if (digits.length > 0) formatted += digits.substring(0, 2);
  if (digits.length >= 3) formatted += ':' + digits.substring(2, 4);
  return formatted;
};

export default function RegisterClinicWorkingHours({
  workingHours,
  setWorkingHours,
}: RegisterClinicWorkingHoursProps) {
  const dayConfigs = buildDayConfigs(workingHours);

  const handleToggleDay = (weekday: string) => {
    const updated = dayConfigs.map((dayConfig) => {
      if (dayConfig.weekday !== weekday) return dayConfig;
      const nowEnabled = !dayConfig.enabled;
      return {
        ...dayConfig,
        enabled: nowEnabled,
        periods: nowEnabled ? DEFAULT_PERIODS : dayConfig.periods,
      };
    });
    setWorkingHours(buildWorkingHours(updated));
  };

  const handleAddPeriod = (weekday: string) => {
    const updated = dayConfigs.map((dayConfig) => {
      if (dayConfig.weekday !== weekday) return dayConfig;
      return {
        ...dayConfig,
        periods: [...dayConfig.periods, { startTime: '', endTime: '' }],
      };
    });
    setWorkingHours(buildWorkingHours(updated));
  };

  const handleRemovePeriod = (weekday: string, periodIndex: number) => {
    const updated = dayConfigs.map((d) => {
      if (d.weekday !== weekday) return d;
      const newPeriods = d.periods.filter((_, i) => i !== periodIndex);
      return { ...d, periods: newPeriods.length > 0 ? newPeriods : d.periods };
    });
    setWorkingHours(buildWorkingHours(updated));
  };

  const handlePeriodChange = (
    weekday: string,
    periodIndex: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    const updated = dayConfigs.map((d) => {
      if (d.weekday !== weekday) return d;
      const newPeriods = d.periods.map((p, i) => {
        if (i !== periodIndex) return p;
        return { ...p, [field]: formatTimeValue(value) };
      });
      return { ...d, periods: newPeriods };
    });
    setWorkingHours(buildWorkingHours(updated));
  };

  return (
    <section className={styles.section}>
      <h2>Horários de funcionamento</h2>
      <p className={styles.subtitle}>
        Agora nos informe quais são os dias e horários de funcionamento da sua clínica.
      </p>

      <div className={styles.tableWrapper}>
        <div className={styles.legend}>
          <span>Dia da semana</span>
          <span>Ativar</span>
          <span>Períodos</span>
        </div>

        <ul className={styles.daysList}>
          {dayConfigs.map((day) => (
            <li key={day.weekday} className={styles.dayRow}>
              <span className={styles.dayLabel}>{day.label}</span>

              <div className={styles.switchCell}>
                <SwitchComponent
                  isOn={day.enabled}
                  handleToggle={() => handleToggleDay(day.weekday)}
                />
              </div>

              <div className={styles.periodsCell}>
                {day.enabled ? (
                  <>
                    {day.periods.map((period, idx) => (
                      <div key={idx} className={styles.periodRow}>
                        <div className={styles.timeInput}>
                          <InputComponent
                            label=""
                            placeholder="00:00"
                            value={period.startTime}
                            handleChangeInput={(e) =>
                              handlePeriodChange(day.weekday, idx, 'startTime', e.target.value)
                            }
                          />
                        </div>
                        <span className={styles.timeSeparator}>até</span>
                        <div className={styles.timeInput}>
                          <InputComponent
                            label=""
                            placeholder="00:00"
                            value={period.endTime}
                            handleChangeInput={(e) =>
                              handlePeriodChange(day.weekday, idx, 'endTime', e.target.value)
                            }
                          />
                        </div>
                        {day.periods.length > 1 && (
                          <button
                            type="button"
                            className={styles.removePeriodBtn}
                            onClick={() => handleRemovePeriod(day.weekday, idx)}
                            title="Remover período"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.addPeriodBtn}
                      onClick={() => handleAddPeriod(day.weekday)}
                    >
                      + Adicionar período
                    </button>
                  </>
                ) : (
                  <span className={styles.closedLabel}>Fechado</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
