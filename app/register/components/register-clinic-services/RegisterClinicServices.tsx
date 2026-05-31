'use client';

import InputComponent from '@/app/components/InputComponent/InputComponent';
import SwitchComponent from '@/app/components/SwitchComponent/SwitchComponent';
import { TextAreaComponent } from '@/app/components/TextAreaComponent/TextAreaComponent';
import { useState } from 'react';
import styles from './styles.module.css';

export type ServiceType = {
  id?: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
};

type RegisterClinicServicesProps = {
  services: ServiceType[];
  setServices: (value: ServiceType[]) => void;
  chargesEvaluation: boolean;
  setChargesEvaluation: (value: boolean) => void;
  evaluationPrice: number;
  setEvaluationPrice: (value: number) => void;
  textAreaValue: string;
  setTextAreaValue: (value: string) => void;
  showEvaluationSection?: boolean;
  showAdditionalInformation?: boolean;
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
  chargesEvaluation,
  setChargesEvaluation,
  evaluationPrice,
  setEvaluationPrice,
  textAreaValue,
  setTextAreaValue,
  showEvaluationSection = true,
  showAdditionalInformation = true,
}: RegisterClinicServicesProps) {
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState(0);
  const [priceDisplay, setPriceDisplay] = useState('');
  const evaluationPriceDisplay =
    evaluationPrice > 0
      ? (evaluationPrice / 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '';

  const canAdd = serviceName.trim().length > 0;

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPrice: (value: string) => void,
  ) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setPrice('');
      return;
    }
    const cents = parseInt(digits, 10);
    setPrice(
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
        durationMinutes: duration || 0,
        priceCents: parsePriceToCents(priceDisplay),
      },
    ]);
    setServiceName('');
    setDuration(0);
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
      {showEvaluationSection && (
      <div className={styles.evaluationBox}>
        <div className={styles.evaluationHeader}>
          <p className={styles.evaluationLabel}>Sua clínica cobra por consulta inicial?</p>
          <SwitchComponent
            handleToggle={() => setChargesEvaluation(!chargesEvaluation)}
            isOn={chargesEvaluation}
          />
        </div>
        {chargesEvaluation && (
          <div className={styles.evaluationInput}>
            <InputComponent
              required
              value={evaluationPriceDisplay}
              placeholder="0,00"
              label="Qual o valor?"
              handleChangeInput={(event) => {
                const digits = event.target.value.replace(/\D/g, '');
                const cents = digits ? parseInt(digits, 10) : 0;
                setEvaluationPrice(cents);
              }}
            />
          </div>
        )}
      </div>
      )}
      <div style={{ marginTop: '1rem' }} className={styles.inputRow}>
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
        {/*
        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label}>Duração (min)</label>
          <input
            className={styles.input}
            type="text"
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
            onKeyDown={handleKeyDown}
          />
        </div> */}

        <div className={styles.field} style={{ flex: 2 }}>
          <label className={styles.label}>Preço</label>
          <input
            className={styles.input}
            type="text"
            placeholder="0,00"
            value={priceDisplay}
            onChange={(e) => handlePriceChange(e, setPriceDisplay)}
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
            <div key={service.id ?? index} className={styles.chip}>
              <span className={styles.chipName}>{service.name}</span>
              {/* {service.durationMinutes !== 0 && (
                <span className={styles.chipBadge}>{service.durationMinutes} min</span>
              )} */}
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
      {showAdditionalInformation && (
      <div className={styles.moreInformationArea}>
        <h3>Informações adicionais</h3>
        <p>Adicione informações importantes a respeito da sua clínica.</p>
        <div className={styles.textAreaContainer}>
          <TextAreaComponent
            value={textAreaValue}
            onChange={setTextAreaValue}
            name="moreInformation"
            id="moreInformation"
            resize={false}
            placeholder="Ex.: especialidades, observações de atendimento, instruções importantes para pacientes..."
          />
        </div>
      </div>
      )}
    </section>
  );
}
