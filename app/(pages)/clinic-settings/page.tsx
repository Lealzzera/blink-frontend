"use client";

import { useMemo, useState } from "react";
import styles from "./style.module.css";
import InputComponent from "../../components/InputComponent/InputComponent";
import SwitchComponent from "../../components/SwitchComponent/SwitchComponent";
import ButtonComponent from "../../components/ButtonComponent/ButtonComponent";

type DaySettings = {
  id: number;
  key: string;
  label: string;
  enabled: boolean;
  open: string; // HH:MM
  pauseStart: string;
  pauseEnd: string;
  close: string;
  error?: string | null;
};

const DEFAULT_DAYS = [
  ["mon", "Segunda"],
  ["tue", "Terça"],
  ["wed", "Quarta"],
  ["thu", "Quinta"],
  ["fri", "Sexta"],
  ["sat", "Sábado"],
  ["sun", "Domingo"],
] as const;

export default function ClinicSettingsPage() {
  const initial = useMemo<DaySettings[]>(() => {
    return DEFAULT_DAYS.map(([key, label], idx) => ({
      id: idx,
      key,
      label,
      enabled: idx < 5, // weekdays enabled by default
      open: "08:00",
      pauseStart: "12:00",
      pauseEnd: "13:30",
      close: "18:00",
      error: null,
    }));
  }, []);

  const [days, setDays] = useState<DaySettings[]>(initial);
  const [globalError, setGlobalError] = useState<string | null>(null);

  function updateDay(id: number, patch: Partial<DaySettings>) {
    setDays((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch, error: null } : d))
    );
  }

  function validateDay(d: DaySettings): string | null {
    if (!d.enabled) return null;
    const toMins = (t: string) => {
      const parts = t.split(":");
      if (parts.length !== 2) return NaN;
      const [hStr, mStr] = parts;
      const h = Number(hStr);
      const m = Number(mStr);
      if (
        Number.isNaN(h) ||
        Number.isNaN(m) ||
        h < 0 ||
        h > 23 ||
        m < 0 ||
        m > 59
      )
        return NaN;
      return h * 60 + m;
    };

    const open = toMins(d.open);
    const close = toMins(d.close);
    if (isNaN(open) || isNaN(close))
      return "Horários inválidos (use 00:00 - 23:59)";
    if (open >= close)
      return "Horário de abertura deve ser antes do fechamento";
    const pauseStart = toMins(d.pauseStart);
    const pauseEnd = toMins(d.pauseEnd);
    // if pause fields are empty keep valid
    if (d.pauseStart && d.pauseEnd) {
      if (isNaN(pauseStart) || isNaN(pauseEnd))
        return "Horário de pausa inválido (use 00:00 - 23:59)";
      if (!(open <= pauseStart && pauseStart < pauseEnd && pauseEnd <= close))
        return "Pausa deve ficar entre abertura e fechamento e ter início antes do fim";
    }
    return null;
  }

  function handleSave() {
    let ok = true;
    const newDays = days.map((d) => {
      const err = validateDay(d);
      if (err) ok = false;
      return { ...d, error: err };
    });
    setDays(newDays);
    if (!ok) {
      setGlobalError("Corrija os horários marcados antes de salvar.");
      return;
    }

    setGlobalError(null);
    // The user said they'll implement endpoint calls; just log for now
    const payload = newDays.map(
      ({ id, key, enabled, open, pauseStart, pauseEnd, close }) => ({
        id,
        key,
        enabled,
        open,
        pauseStart,
        pauseEnd,
        close,
      })
    );
    console.log("Clinic hours to save:", payload);
    // show a lightweight UI feedback
    alert(
      "Configurações salvas (local). Implementar chamada ao endpoint conforme necessário."
    );
  }

  function handleReset() {
    setDays(initial);
    setGlobalError(null);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Configurações da clínica</h2>
        <p className={styles.subtitle}>
          Defina os dias de funcionamento e os horários (abertura, pausa e
          fechamento).
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.rowHeader}>
          <div>DIA</div>
          <div>ATIVO</div>
          <div>ABERTURA</div>
          <div>INÍCIO PAUSA</div>
          <div>FIM PAUSA</div>
          <div>FECHAMENTO</div>
        </div>

        <div className={styles.rows}>
          {days.map((d) => (
            <div key={d.key} className={styles.row}>
              <div className={styles.dayLabel}>{d.label}</div>
              <div className={styles.dayToggle}>
                <SwitchComponent
                  isOn={d.enabled}
                  handleToggle={() => updateDay(d.id, { enabled: !d.enabled })}
                />
              </div>

              <div className={styles.timeInput}>
                <InputComponent
                  type="time"
                  value={d.open}
                  handleChangeInput={(e) =>
                    updateDay(d.id, { open: e.target.value })
                  }
                  disabled={!d.enabled}
                />
              </div>

              <div className={styles.timeInput}>
                <InputComponent
                  type="time"
                  value={d.pauseStart}
                  handleChangeInput={(e) =>
                    updateDay(d.id, { pauseStart: e.target.value })
                  }
                  disabled={!d.enabled}
                />
              </div>

              <div className={styles.timeInput}>
                <InputComponent
                  type="time"
                  value={d.pauseEnd}
                  handleChangeInput={(e) =>
                    updateDay(d.id, { pauseEnd: e.target.value })
                  }
                  disabled={!d.enabled}
                />
              </div>

              <div className={styles.timeInput}>
                <InputComponent
                  type="time"
                  value={d.close}
                  handleChangeInput={(e) =>
                    updateDay(d.id, { close: e.target.value })
                  }
                  disabled={!d.enabled}
                />
              </div>

              {d.error && <div className={styles.rowError}>{d.error}</div>}
            </div>
          ))}
        </div>

        {globalError && <div className={styles.globalError}>{globalError}</div>}

        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            <ButtonComponent text="Resetar" onClick={handleReset} />
          </div>
          <div className={styles.actionsRight}>
            <ButtonComponent text="Salvar" onClick={handleSave} />
          </div>
        </div>
      </div>
    </div>
  );
}
