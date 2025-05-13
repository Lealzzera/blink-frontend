import styles from "./styles/modal.module.css";
import { useState } from "react";
import { Check, X } from "lucide-react";

export default function Modal({ event, onClose }: any) {
  const { start, end, extendedProps } = event;
  const [venda, setVenda] = useState("");

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2>Detalhes do Agendamento</h2>
        <p><strong>Paciente:</strong> {extendedProps.paciente}</p>
        <p><strong>Telefone:</strong> {extendedProps.phone}</p>
        <p><strong>Tipo:</strong> {extendedProps.tipo}</p>
        <p><strong>Data:</strong> {start.toLocaleDateString()}</p>
        <p>
          <strong>Hora:</strong> {start.toLocaleTimeString()}
          {end ? ` - ${end.toLocaleTimeString()}` : ''}
        </p>

        <div className={styles.actions}>

          <div className={styles.vendaSection}>
            <input
              type="number"
              placeholder="Valor da venda"
              value={venda}
              onChange={(e) => setVenda(e.target.value)}
              className={styles.input}
            />
            <button className={styles.iconButton}>
              <Check size={20} />
            </button>
          </div>
            <div className={styles.containerBtn}>
                <button className={styles.cancelar}>Cancelar agendamento</button>
                <button className={styles.confirm}>Marcar como compareceu</button>
            </div>
        </div>

        <button className={styles.closeIcon} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
