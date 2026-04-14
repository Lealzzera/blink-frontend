'use client';

import { useEffect, useState } from 'react';
import ButtonComponent from '../components/ButtonComponent/ButtonComponent';
import RegisterClinicInfo from './components/register-clinic-info/RegisterClinicInfo';
import RegisterClinicServices from './components/register-clinic-services/RegisterClinicServices';
import RegisterClinicWorkingHours from './components/register-clinic-working-hours/RegisterClinicWorkingHours';
import RegisterUserInfoComponent from './components/register-user-info/RegisterUserInfoComponent';
import styles from './styles.module.css';

type WorkingHour = {
  weekday: string;
  startTime: string;
  endTime: string;
};

type ServiceType = {
  name: string;
  durationMinutes: string;
  priceCents: number;
};

type SettingsObject = {
  chargesEvaluation: boolean;
  evaluationPriceCents: number;
  maxAppointmentsPerSlot: number;
  appointmentDurationMinutes: number;
  allowRescheduling: boolean;
  allowCancelation: boolean;
  aiAgentName: string;
};

export type RegisterClinicObject = {
  userFullName: string;
  userEmail: string;
  password: string;
  clinicName: string;
  clinicType: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  state: string;
  planId: string;
  workingHours: WorkingHour[];
  services: ServiceType[];
  settings: SettingsObject;
};

const TOTAL_STEPS = 4;

const STEP_LABELS = ['Usuário', 'Clínica', 'Horários', 'Serviços'];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(1);
  const [registerObject, setRegisterObject] = useState<RegisterClinicObject>({
    userFullName: '',
    userEmail: '',
    password: '',
    clinicName: '',
    clinicType: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    state: '',
    planId: '',
    workingHours: [],
    services: [],
    settings: {
      chargesEvaluation: false,
      evaluationPriceCents: 0,
      maxAppointmentsPerSlot: 0,
      appointmentDurationMinutes: 0,
      allowRescheduling: false,
      allowCancelation: false,
      aiAgentName: '',
    },
  });

  const clinicTypeOptions = [
    { value: 'DENTAL', label: 'Clínica Odontológica' },
    { value: 'MEDICAL', label: 'Clínica Médica' },
    { value: 'AESTHETIC', label: 'Clínica Estética' },
    { value: 'PSYCHOLOGY', label: 'Clínica de Psicologia' },
    { value: 'OTHER', label: 'Outro' },
  ];

  const disableNext =
    (currentStep === 1 &&
      (password !== confirmPassword ||
        password.length < 8 ||
        !name ||
        !lastName ||
        !registerObject.userEmail)) ||
    (currentStep === 2 &&
      (!registerObject.clinicName ||
        !registerObject.address ||
        !registerObject.city ||
        !registerObject.state ||
        !registerObject.clinicType)) ||
    (currentStep === 3 && registerObject.workingHours.length === 0);

  const handleChangeObjectValue = <K extends keyof RegisterClinicObject>(
    key: K,
    value: RegisterClinicObject[K],
  ) => {
    setRegisterObject((prev) => ({ ...prev, [key]: value }));
  };

  const handleManageNextStep = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentStep === 1 && !emailRegex.test(registerObject.userEmail)) {
      setShowErrorMessage('Email Inválido.')
      return;
    }
    setShowErrorMessage('');
    setCurrentStep((prev) => prev + 1);
  };

  useEffect(() => {
    console.log({ registerObject });
  }, [registerObject]);

  return (
    <section className={styles.registerSection}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cadastro</h1>
        <p className={styles.pageSubtitle}>Siga os passos abaixo para criar a sua conta</p>
      </div>
      <div className={styles.stepsBar}>
        {STEP_LABELS.map((label, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          return (
            <div key={step} className={styles.stepItem}>
              <div
                className={`${styles.stepCircle} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}
              >
                {done ? '✓' : step}
              </div>
              <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>
                {label}
              </span>
              {step < TOTAL_STEPS && (
                <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.registerContainer}>
        {currentStep === 1 && (
          <RegisterUserInfoComponent
            showErrorMessage={showErrorMessage.length > 0}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            setEmailValue={(value) => handleChangeObjectValue('userEmail', value)}
            emailValue={registerObject.userEmail}
            nameValue={name}
            setNameValue={setName}
            lastNameValue={lastName}
            setLastNameValue={setLastName}
          />
        )}
        {currentStep === 2 && (
          <RegisterClinicInfo
            clinicPostalCode={registerObject.postalCode}
            setClinicPostalCode={(value) => handleChangeObjectValue('postalCode', value)}
            clinicTypeValue={registerObject.clinicType}
            setClinicTypeValue={(value) => handleChangeObjectValue('clinicType', value)}
            clinicTypeOptions={clinicTypeOptions}
            clinicNameValue={registerObject.clinicName}
            setClinicNameValue={(value) => handleChangeObjectValue('clinicName', value)}
            clinicPhoneNumber={registerObject.phone}
            setClinicPhoneNumber={(value) => handleChangeObjectValue('phone', value)}
            clinicAddress={registerObject.address}
            setClinicAddress={(value) => handleChangeObjectValue('address', value)}
            clinicCity={registerObject.city}
            setClinicCity={(value) => handleChangeObjectValue('city', value)}
            clinicState={registerObject.state}
            setClinicState={(value) => handleChangeObjectValue('state', value)}
          />
        )}
        {currentStep === 3 && (
          <RegisterClinicWorkingHours
            workingHours={registerObject.workingHours}
            setWorkingHours={(value) => handleChangeObjectValue('workingHours', value)}
          />
        )}
        {currentStep === 4 && (
          <RegisterClinicServices
            services={registerObject.services}
            setServices={(value) => handleChangeObjectValue('services', value)}
          />
        )}
      </div>

      <div className={styles.navRow}>
        {showErrorMessage && <p className={styles.errorMessage}>{showErrorMessage}</p>}
        <div className={styles.navButtonsContainer}>
        <div className={styles.navBtn}>
          <ButtonComponent
            disabled={currentStep === 1}
            text="Voltar"
            handleClickButton={() => setCurrentStep((prev) => prev - 1)}
          />
        </div>
        <div className={styles.navBtn}>
          <ButtonComponent
            disabled={disableNext}
            text={currentStep === TOTAL_STEPS ? 'Concluir' : 'Próximo'}
            handleClickButton={handleManageNextStep}
          />
        </div>
        </div>
      </div>
    </section>
  );
}
