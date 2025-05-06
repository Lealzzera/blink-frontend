import styles from "./config.module.css"
import { Switch } from "@/components/ui/switch"

export default function Config(){
    return(
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

        </div>
    )
}