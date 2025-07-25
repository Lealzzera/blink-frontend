"use client";

import { useState } from "react";
import styles from "./styles/calendario.module.css";

interface ModalValorVendaProps {
  onClose: () => void;
  onConfirm: (valor: string) => void;
  appointmentId: number;
}

export default function ModalValorVenda({ onClose, onConfirm, appointmentId }: ModalValorVendaProps) {
  const [valor, setValor] = useState("");

  const formatDate = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (valor) {
      try {
        const res = await fetch("https://be.blinkdentalmarketing.com.br/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointment_id: appointmentId,
            value: parseFloat(valor),
            service_type: 1, // fixo por enquanto (ajustar se quiser)
            registered_by_user: 1, // fixo, ajustar conforme auth ou contexto
            registered_at: formatDate(new Date()),
          }),
        });
        
        const data = await res.json()
        console.log(data)

        if (!res.ok) throw new Error("Erro ao registrar venda");
      } catch (error) {
        console.error("Erro ao registrar venda:", error);
      }
    }

    onConfirm(valor);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Informe o valor da venda</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor (opcional)"
            autoFocus
            step="0.01"
            min="0"
          />
          <div className={styles.modalButtons}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
