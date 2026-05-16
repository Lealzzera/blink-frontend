'use client';

import { useEffect, useState } from 'react';
import { getPlansList } from '../actions/getPlansList';
import getUserEmail from '../actions/getUserEmail';
import ButtonComponent from '../components/ButtonComponent/ButtonComponent';
import { Plan, RegisterClinicObject } from '../types/types';
import { PaymentForm } from './components/payment-form/PaymentForm';
import { PlansSection } from './components/plans-section/PlansSection';
import RegisterClinicInfo from './components/register-clinic-info/RegisterClinicInfo';
import RegisterClinicServices from './components/register-clinic-services/RegisterClinicServices';
import RegisterClinicWorkingHours from './components/register-clinic-working-hours/RegisterClinicWorkingHours';
import RegisterUserInfoComponent from './components/register-user-info/RegisterUserInfoComponent';
import styles from './styles.module.css';

const INITIAL_REGISTER_OBJECT: RegisterClinicObject = {
  name: '',
  lastName: '',
  userEmail: '',
  password: '',
  confirmPassword: '',
  clinicName: '',
  clinicType: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  state: '',
  selectedPlan: {
    planId: '',
    stripePriceId: '',
  },
  workingHours: [],
  services: [],
  settings: {
    chargesEvaluation: false,
    evaluationPriceCents: 0,
  },
};

const REGISTER_COOKIE_NAME = 'blink_register_draft';
const REGISTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function readRegisterCookie(): Partial<RegisterClinicObject> | null {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${REGISTER_COOKIE_NAME}=`));
  if (!entry) return null;
  try {
    const rawValue = entry.substring(`${REGISTER_COOKIE_NAME}=`.length);
    return JSON.parse(decodeURIComponent(rawValue));
  } catch (err) {
    console.warn('Falha ao ler registerObject do cookie:', err);
    return null;
  }
}

function writeRegisterCookie(value: RegisterClinicObject) {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${REGISTER_COOKIE_NAME}=${encoded}; path=/; max-age=${REGISTER_COOKIE_MAX_AGE}; samesite=lax`;
}

export default function RegisterPage() {
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [registerObject, setRegisterObject] =
    useState<RegisterClinicObject>(INITIAL_REGISTER_OBJECT);

  const clinicTypeOptions = [
    { value: 'DENTAL', label: 'Clínica Odontológica' },
    { value: 'MEDICAL', label: 'Clínica Médica' },
    { value: 'AESTHETIC', label: 'Clínica Estética' },
    { value: 'PSYCHOLOGY', label: 'Clínica de Psicologia' },
    { value: 'OTHER', label: 'Outro' },
  ];

  const disableNext =
    (currentStep === 1 &&
      (registerObject.password !== registerObject.confirmPassword ||
        registerObject.password.length < 8 ||
        !registerObject.name ||
        !registerObject.lastName ||
        !registerObject.userEmail)) ||
    (currentStep === 2 &&
      (!registerObject.clinicName ||
        !registerObject.address ||
        !registerObject.city ||
        !registerObject.state ||
        !registerObject.clinicType)) ||
    (currentStep === 3 && !registerObject.workingHours.length) ||
    (currentStep === 5 && !registerObject.selectedPlan.planId);

  const handleChangeObjectValue = <K extends keyof RegisterClinicObject>(
    key: K,
    value: RegisterClinicObject[K],
  ) => {
    setRegisterObject((prev) => ({ ...prev, [key]: value }));
  };

  const handleChangeSettingsValue = <K extends keyof RegisterClinicObject['settings']>(
    key: K,
    value: RegisterClinicObject['settings'][K],
  ) => {
    setRegisterObject((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  };

  const handleManageNextStep = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentStep === 1 && !emailRegex.test(registerObject.userEmail)) {
      setShowErrorMessage('Email Inválido.');
      return;
    }
    if (currentStep === 1 && emailRegex.test(registerObject.userEmail)) {
      const { exists } = await getUserEmail(registerObject.userEmail);
      if (exists) {
        setShowErrorMessage('Email já cadastrado.');
        return;
      }
    }
    if (currentStep === 5 && !registerObject.selectedPlan.planId) {
      return;
    }
    setShowErrorMessage('');
    setCurrentStep((prev) => prev + 1);
  };

  const createClinicAndUser = () => {
    const clinicData = {
      userFullName: `${registerObject.name.trim()} ${registerObject.lastName.trim()}`,
      userEmail: registerObject.userEmail.trim(),
      password: registerObject.confirmPassword,
      clinicName: registerObject.clinicName.trim(),
      clinicType: registerObject.clinicType,
      address: registerObject.address.trim(),
      postalCode: registerObject.postalCode.split('-').join(''),
      city: registerObject.city,
      state: registerObject.state,
      planId: registerObject.selectedPlan.planId,
      workingHours: registerObject.workingHours,
      services: registerObject.services,
      settings: {
        ...registerObject.settings,
        evaluationPriceCents: !registerObject.settings.chargesEvaluation
          ? 0
          : Number(registerObject.settings.evaluationPriceCents.toString().replace(/[.,]/g, '')) *
            100,
      },
    };
    return clinicData;
  };

  useEffect(() => {
    const saved = readRegisterCookie();
    if (saved) {
      setRegisterObject((prev) => ({
        ...prev,
        ...saved,
        settings: {
          ...prev.settings,
          ...(saved.settings ?? {}),
        },
      }));
    }
    setHydrated(true);

    const fetchPlansList = async () => {
      const response = await getPlansList();
      if (response?.plans) setPlansList(response.plans);
    };
    fetchPlansList();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeRegisterCookie(registerObject);
  }, [registerObject, hydrated]);

  return (
    <section className={styles.registerSection}>
      {currentStep < 5 && (
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Cadastro</h1>
          <p className={styles.pageSubtitle}>Siga os passos abaixo para criar a sua conta</p>
        </div>
      )}
      {currentStep < 5 && (
        <div className={styles.registerContainer}>
          {currentStep === 1 && (
            <RegisterUserInfoComponent
              showErrorMessage={showErrorMessage.length > 0}
              password={registerObject.password}
              setPassword={(value) => handleChangeObjectValue('password', value)}
              confirmPassword={registerObject.confirmPassword}
              setConfirmPassword={(value) => handleChangeObjectValue('confirmPassword', value)}
              setEmailValue={(value) => handleChangeObjectValue('userEmail', value)}
              emailValue={registerObject.userEmail}
              nameValue={registerObject.name}
              setNameValue={(value) => handleChangeObjectValue('name', value)}
              lastNameValue={registerObject.lastName}
              setLastNameValue={(value) => handleChangeObjectValue('lastName', value)}
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
              evaluationPrice={registerObject.settings.evaluationPriceCents}
              setEvaluationPrice={(value) =>
                handleChangeSettingsValue('evaluationPriceCents', value)
              }
              chargesEvaluation={registerObject.settings.chargesEvaluation}
              setChargesEvaluation={(value) =>
                handleChangeSettingsValue('chargesEvaluation', value)
              }
              setServices={(value) => handleChangeObjectValue('services', value)}
            />
          )}
        </div>
      )}

      {currentStep === 5 && (
        <PlansSection
          plansList={plansList}
          setSelectedPlan={(value) => handleChangeObjectValue('selectedPlan', value)}
          selectedPlan={registerObject.selectedPlan.planId}
        />
      )}
      {currentStep === 6 && (
        <PaymentForm
          stripePriceId={registerObject.selectedPlan.stripePriceId}
          clinicData={createClinicAndUser()}
        />
      )}

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
          {currentStep < 6 && (
            <div className={styles.navBtn}>
              <ButtonComponent
                disabled={disableNext}
                text={'Próximo'}
                handleClickButton={handleManageNextStep}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
