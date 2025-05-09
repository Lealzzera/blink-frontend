"use client";
import styles from "./config.module.css";
import { Switch } from "@/components/ui/switch";

export default function Config() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configurações da Clínica</h1>

      <div className={styles.item}>
        <h3 className={styles.label}>Duração padrão da consulta</h3>
        <select name="select" id="select" className={styles.select}>
          <option value="30">30min</option>
          <option value="60">1h</option>
          <option value="90">1h30min</option>
          <option value="120">2h</option>
        </select>
      </div>

      <div className={styles.item}>
        <h3>Permitir agendar 2 pacientes no mesmo horário?</h3>
        <Switch className={styles.switch} defaultChecked />
      </div>

      <div className={styles.item}>
        <h3>Número conectado</h3>
        <p className={styles.number}>+55 (11) 98340-1004</p>
      </div>

      <button className={styles.button}>QR Code WhatsApp</button>


      <h2 className={styles.subtitle}>Disponibilidade da Clínica</h2>

        <div className={styles.availability}>

        <div className={styles.availabilityHeader}>
            <span className={styles.day}></span>
            <span className={styles.day}></span>
            <span className={styles.labelSmall}></span>
            <span className={styles.timeLabel}>Início</span>
            <span className={styles.timeLabel}>Fim</span>
            <span className={styles.timeLabel}>Início almoço</span>
            <span className={styles.timeLabel}>Fim almoço</span>
        </div>

        {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((dia, index) => (
            <div key={index} className={styles.availabilityRow}>
            <span className={styles.day}>{dia}</span>
            <label className={styles.labelSmall}>
                Dia de trabalho
                <input type="checkbox" className={styles.checkbox} />
            </label>
            <input type="time" className={styles.timeInput} />
            <input type="time" className={styles.timeInput} />
            <input type="time" className={styles.timeInput} />
            <input type="time" className={styles.timeInput} />
            </div>
        ))}
        </div>
    </div>
  );
}
