"use client";
import styles from "./config.module.css";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useCalendarConfig } from '@/context/CalendarConfigContext';

export default function Config() {
  const { defaultDuration, setDefaultDuration } = useCalendarConfig();
  const { allowDoubleBooking, setAllowDoubleBooking } = useCalendarConfig();

  const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  const [diasTrabalho, setDiasTrabalho] = useState<{ [key: number]: boolean }>(
    Object.fromEntries(diasDaSemana.map((_, i) => [i, false]))
  );

  const [excecoes, setExcecoes] = useState([
    { id: Date.now(), date: "", isOpen: false, start: "", end: "", lunchStart: "", lunchEnd: "" }
  ]);

  const adicionarExcecao = () => {
    setExcecoes([
      ...excecoes,
      { id: Date.now(), date: "", isOpen: false, start: "", end: "", lunchStart: "", lunchEnd: "" }
    ]);
  };

  const atualizarCampo = (id: number, campo: string, valor: string | boolean) => {
    setExcecoes(
      excecoes.map((excecao) =>
        excecao.id === id ? { ...excecao, [campo]: valor } : excecao
      )
    );
  };

  const removerExcecao = (id: number) => {
    setExcecoes(excecoes.filter((excecao) => excecao.id !== id));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configurações da Clínica</h1>

      <div className={styles.item}>
        <h3 className={styles.label}>Duração padrão da consulta</h3>
        <select
          id="select"
          className={styles.select}
          value={defaultDuration}
          onChange={(e) => setDefaultDuration(Number(e.target.value))}
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
          onCheckedChange={setAllowDoubleBooking}
        />
      </div>

      <div className={styles.item}>
        <h3>Número conectado</h3>
        <p className={styles.number}>+55 (11) 98340-1004</p>
      </div>

      <button className={styles.buttonWpp}>QR Code WhatsApp</button>

      <h2 className={styles.subtitle}>Disponibilidade da Clínica</h2>

      <div className={styles.availability}>
        {diasDaSemana.map((dia, index) => (
          <div key={index} className={styles.availabilityRow}>
            <span className={styles.day}>{dia}</span>

            <label className={styles.labelSmall}>
              Dia de trabalho
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={diasTrabalho[index]}
                onChange={() =>
                  setDiasTrabalho((prev) => ({
                    ...prev,
                    [index]: !prev[index],
                  }))
                }
              />
            </label>

            {diasTrabalho[index] && (
              <>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Abertura</label>
                  <input type="time" className={styles.timeInput} />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Início almoço</label>
                  <input type="time" className={styles.timeInput} />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Fim almoço</label>
                  <input type="time" className={styles.timeInput} />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Fechamento</label>
                  <input type="time" className={styles.timeInput} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <h3 className={styles.subheading}>Adicionar Exceções de Funcionamento</h3>
      <div className={styles.exceptionsSection}>
        {excecoes.map((excecao) => (
          <div className={styles.exceptionRow} key={excecao.id}>
            <input
              type="date"
              className={styles.dateInput}
              value={excecao.date}
              onChange={(e) => atualizarCampo(excecao.id, "date", e.target.value)}
            />

            <label className={styles.labelSmall}>
              Clínica abrirá neste dia?
              <input
                type="checkbox"
                checked={excecao.isOpen}
                onChange={(e) =>
                  atualizarCampo(excecao.id, "isOpen", e.target.checked)
                }
                className={styles.checkbox}
              />
            </label>

            {excecao.isOpen && (
              <div className={styles.timeInputs}>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Abertura</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={excecao.start}
                    onChange={(e) =>
                      atualizarCampo(excecao.id, "start", e.target.value)
                    }
                  />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Fechamento</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={excecao.end}
                    onChange={(e) =>
                      atualizarCampo(excecao.id, "end", e.target.value)
                    }
                  />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Início almoço</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={excecao.lunchStart}
                    onChange={(e) =>
                      atualizarCampo(excecao.id, "lunchStart", e.target.value)
                    }
                  />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Fim almoço</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={excecao.lunchEnd}
                    onChange={(e) =>
                      atualizarCampo(excecao.id, "lunchEnd", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removerExcecao(excecao.id)}
            >
              Remover
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.addButton}
          onClick={adicionarExcecao}
        >
          Adicionar nova exceção
        </button>
      </div>
    </div>
  );
}
