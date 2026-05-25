import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import InputComponent from '@/app/components/InputComponent/InputComponent';
import SelectComponent from '@/app/components/SelectComponent/SelectComponent';
import SwitchComponent from '@/app/components/SwitchComponent/SwitchComponent';
import styles from '../../style.module.css';

type ClinicDataSectionComponentProps = {
  clinicName: string;
  setClinicName: (value: string) => void;
  aiAgentName: string;
  setAiAgentName: (value: string) => void;
  appointmentDuration: string;
  setAppointmentDuration: (value: string) => void;
  maxAppointmentsPerSlot: string;
  setMaxAppointmentsPerSlot: (value: string) => void;
  aiAgentNameError: boolean;
  setAiAgentNameError: (value: boolean) => void;
  clinicNameError: boolean;
  setClinicNameError: (value: boolean) => void;
  clinicTypeOptions: { value: string; label: string }[];
  clinicType: string;
  setClinicType: (value: string) => void;
  clinicAddress: string;
  setClinicAddress: (value: string) => void;
  clinicAddressNumber: string;
  setClinicAddressNumber: (value: string) => void;
  handleSaveClinicBasicData: () => void;
  findAddressByPostalCode: () => void;
  handlePostalCodeChange: (value: string) => void;
  clinicPostalCode: string;
  setClinicPostalCode: (value: string) => void;
  clinicCity: string;
  setClinicCity: (value: string) => void;
  clinicState: string;
  setClinicState: (value: string) => void;
  chargesEvaluation: boolean;
  setChargesEvaluation: (value: boolean) => void;
  evaluationPriceCents: number;
  setEvaluationPriceCents: (value: number) => void;
};

function formatPriceCents(cents: number): string {
  if (cents <= 0) return '';

  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ClinicDataSectionComponent({
  clinicName,
  setClinicName,
  aiAgentName,
  setAiAgentName,
  appointmentDuration,
  setAppointmentDuration,
  maxAppointmentsPerSlot,
  setMaxAppointmentsPerSlot,
  aiAgentNameError,
  setAiAgentNameError,
  clinicNameError,
  setClinicNameError,
  clinicTypeOptions,
  clinicType,
  setClinicType,
  clinicAddress,
  setClinicAddress,
  clinicAddressNumber,
  setClinicAddressNumber,
  handleSaveClinicBasicData,
  findAddressByPostalCode,
  handlePostalCodeChange,
  clinicPostalCode,
  setClinicPostalCode,
  clinicCity,
  setClinicCity,
  clinicState,
  setClinicState,
  chargesEvaluation,
  setChargesEvaluation,
  evaluationPriceCents,
  setEvaluationPriceCents,
}: ClinicDataSectionComponentProps) {
  const isSaveDisabled =
    !clinicName.trim() ||
    !aiAgentName.trim() ||
    !appointmentDuration.trim() ||
    !maxAppointmentsPerSlot.trim() ||
    !clinicType.trim() ||
    !clinicAddress.trim() ||
    !clinicAddressNumber.trim() ||
    !clinicPostalCode.trim() ||
    !clinicCity.trim() ||
    !clinicState.trim() ||
    (chargesEvaluation && evaluationPriceCents <= 0);

  return (
    <div className={styles.basicDataCard}>
      <div className={styles.basicDataHeader}>
        <h2>Dados da clínica</h2>
        <p className={styles.subtitle}>
          Defina como sua clínica e seu agente de IA serão identificados.
        </p>
      </div>
      <div className={styles.basicDataForm}>
        <InputComponent
          label="Nome da clínica"
          placeholder="Ex.: Clínica São Lucas"
          value={clinicName}
          required
          error={clinicNameError}
          handleChangeInput={(e) => {
            setClinicNameError(false);
            setClinicName(e.target.value);
          }}
        />
        <InputComponent
          label="Nome do agente de IA"
          placeholder="Ex.: Blink"
          value={aiAgentName}
          required
          error={aiAgentNameError}
          handleChangeInput={(e) => {
            setAiAgentNameError(false);
            setAiAgentName(e.target.value);
          }}
        />
        <InputComponent
          label="Duração do agendamento (minutos)"
          placeholder="Ex.: 30"
          type="number"
          required
          value={appointmentDuration}
          handleChangeInput={(event) => {
            const sanitizedNumericValue = event.target.value.replace(/\D/g, '');
            setAppointmentDuration(sanitizedNumericValue);
          }}
        />
        <InputComponent
          label="Quantidade de agendamentos no mesmo horário"
          placeholder="Ex.: 1"
          type="number"
          required
          value={maxAppointmentsPerSlot}
          handleChangeInput={(event) => {
            const sanitizedNumericValue = event.target.value.replace(/\D/g, '');
            setMaxAppointmentsPerSlot(sanitizedNumericValue);
          }}
        />
        <SelectComponent
          labelSelect="Tipo da clínica"
          idSelect="clinic-type-select"
          options={clinicTypeOptions}
          value={clinicType}
          setValue={setClinicType}
          required
        />
        <InputComponent
          label="Endereço"
          placeholder="Ex.: Rua das Flores"
          required
          value={clinicAddress}
          handleChangeInput={(event) => setClinicAddress(event.target.value)}
        />
        <InputComponent
          label="Número"
          placeholder="Ex.: 123"
          required
          value={clinicAddressNumber}
          handleChangeInput={(event) => setClinicAddressNumber(event.target.value)}
        />
        <InputComponent
          label="CEP"
          placeholder="Ex.: 01234-567"
          required
          value={clinicPostalCode}
          onBlur={findAddressByPostalCode}
          handleChangeInput={(event) => handlePostalCodeChange(event.target.value)}
        />
        <InputComponent
          label="Cidade"
          placeholder="Ex.: São Paulo"
          required
          value={clinicCity}
          handleChangeInput={(event) => setClinicCity(event.target.value)}
        />
        <InputComponent
          label="Estado"
          placeholder="Ex.: SP"
          required
          value={clinicState}
          handleChangeInput={(event) => setClinicState(event.target.value)}
        />
        <div className={styles.evaluationSection}>
          <div className={styles.evaluationHeader}>
            <p className={styles.evaluationLabel}>Sua clínica cobra por consulta inicial?</p>
            <SwitchComponent
              isOn={chargesEvaluation}
              handleToggle={() => setChargesEvaluation(!chargesEvaluation)}
            />
          </div>
          {chargesEvaluation && (
            <div className={styles.evaluationInput}>
              <InputComponent
                label="Valor da consulta inicial"
                placeholder="0,00"
                required
                value={formatPriceCents(evaluationPriceCents)}
                handleChangeInput={(event) => {
                  const digits = event.target.value.replace(/\D/g, '');
                  setEvaluationPriceCents(digits ? parseInt(digits, 10) : 0);
                }}
              />
            </div>
          )}
        </div>
      </div>
      {/* <div className={styles.customPromptSection}>
        <label className={styles.customPromptLabel}>Prompt personalizado da IA</label>
        <p className={styles.customPromptDescription}>
          Instrua o agente de IA sobre como ele deve se comportar, responder e interagir com os
          pacientes.
        </p>
        <textarea
          className={styles.customPromptTextarea}
          placeholder="Ex.: Você é um assistente simpático da clínica. Sempre cumprimente o paciente pelo nome e ofereça ajuda para agendar consultas..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={6}
        />
      </div> */}
      <div className={styles.basicDataActions}>
        <ButtonComponent
          disabled={isSaveDisabled}
          text="Salvar dados"
          handleClickButton={handleSaveClinicBasicData}
        />
      </div>
    </div>
  );
}
