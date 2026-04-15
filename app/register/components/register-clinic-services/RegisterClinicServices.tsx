'use client';

import { useState } from 'react';
import styles from './styles.module.css';

export type ServiceType = {
  name: string;
  durationMinutes: string;
  priceCents: number;
};

type RegisterClinicServicesProps = {
  services: ServiceType[];
  setServices: (value: ServiceType[]) => void;
};

function parsePriceToCents(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function RegisterClinicServices({
  services,
  setServices,
}: RegisterClinicServicesProps) {
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');

  const canAdd = serviceName.trim().length > 0;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setPriceDisplay('');
      return;
    }
    const cents = parseInt(digits, 10);
    setPriceDisplay(
      (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  };

  const handleAddService = () => {
    if (!canAdd) return;
    setServices([
      ...services,
      {
        name: serviceName.trim(),
        durationMinutes: duration || '0',
        priceCents: parsePriceToCents(priceDisplay),
      },
    ]);
    setServiceName('');
    setDuration('');
    setPriceDisplay('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddService();
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Serviços</h2>
      <p className={styles.subtitle}>
        Agora preencha abaixo os serviços realizados pela sua clínica
      </p>

      <div className={styles.inputRow}>
        <div className={styles.field} style={{ flex: 3 }}>
          <label className={styles.label}>Serviço</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Ex.: Limpeza"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label}>Duração (min)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.field} style={{ flex: 2 }}>
          <label className={styles.label}>Preço</label>
          <input
            className={styles.input}
            type="text"
            placeholder="0,00"
            value={priceDisplay}
            onChange={handlePriceChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={handleAddService}
          disabled={!canAdd}
          title="Adicionar serviço"
        >
          +
        </button>
      </div>

      <div className={styles.chipsArea}>
        {services.length === 0 ? (
          <p className={styles.empty}>Nenhum serviço adicionado ainda.</p>
        ) : (
          services.map((service, index) => (
            <div key={index} className={styles.chip}>
              <span className={styles.chipName}>{service.name}</span>
              {service.durationMinutes !== '0' && (
                <span className={styles.chipBadge}>{service.durationMinutes} min</span>
              )}
              {service.priceCents > 0 && (
                <span className={styles.chipBadge}>{formatPriceCents(service.priceCents)}</span>
              )}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => setServices(services.filter((_, i) => i !== index))}
                aria-label={`Remover ${service.name}`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
