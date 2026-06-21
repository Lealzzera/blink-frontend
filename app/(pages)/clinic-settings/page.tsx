'use client';

import { deleteAtypicalDay } from '@/app/actions/deleteAtypicalDay';
import { getAtypicalDaysList } from '@/app/actions/getAtypicalDaysList';
import { getClinicConfiguration } from '@/app/actions/getClinicConfiguration';
import { getClinicServices } from '@/app/actions/getClinicServices';
import { getClinicWorkingHours } from '@/app/actions/getClinicWorkingHours';
import postAtypicalDayAvailability from '@/app/actions/postAtypicalDayAvailability';
import { putClinicAvailability } from '@/app/actions/putClinicAvailability';
import { putClinicConfiguration } from '@/app/actions/putClinicConfiguration';
import { putClinicServices } from '@/app/actions/putClinicServices';
import putUpdateAtypicalDay from '@/app/actions/putUpdateAtypicalDay';
import BaseModalComponent from '@/app/components/BaseModalComponent/BaseModalComponent';
import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import InputComponent from '@/app/components/InputComponent/InputComponent';
import SwitchComponent from '@/app/components/SwitchComponent/SwitchComponent';
import { useUser } from '@/app/context/userContext';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import type { ServiceType } from '../../register/components/register-clinic-services/RegisterClinicServices';
import RegisterClinicWorkingHours, {
  WorkingHour,
} from '../../register/components/register-clinic-working-hours/RegisterClinicWorkingHours';
import ClinicDataSectionComponent from './components/ClinicDataSectionComponent/ClinicDataSectionComponent';
import ClinicServicesSectionComponent from './components/ClinicServicesSectionComponent/ClinicServicesSectionComponent';
import styles from './style.module.css';

type AtypicalDayObject = {
  specialDate: string;
  exception_day: string;
  is_working_day: boolean;
  note: string;
  open: string;
  close: string;
  break_start: string;
  break_end: string;
};

type AtypicalDayForm = Omit<AtypicalDayObject, 'specialDate'>;

const CLINIC_TYPE_LABEL_BY_VALUE: Record<string, string> = {
  DENTAL: 'Odontologia',
  MEDICAL: 'Medica',
  AESTHETIC: 'Estetica',
  PSYCHOLOGY: 'Psicologia',
  OTHER: 'Outro',
};

const CLINIC_TYPE_OPTIONS = Object.entries(CLINIC_TYPE_LABEL_BY_VALUE).map(
  ([clinicTypeValue, clinicTypeLabel]) => ({
    value: clinicTypeValue,
    label: clinicTypeLabel,
  }),
);

const EMPTY_ATYPICAL_DAY_FORM: AtypicalDayForm = {
  exception_day: '',
  is_working_day: false,
  note: '',
  open: '',
  close: '',
  break_start: '',
  break_end: '',
};

function formatPostalCode(value: string) {
  const cleanedPostalCode = value.replace(/\D/g, '');
  return cleanedPostalCode.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

function splitAddressAndNumber(address: string | null) {
  if (!address) {
    return { street: '', number: '' };
  }

  const [street, ...addressNumberParts] = address.split(',');

  return {
    street: street.trim(),
    number: addressNumberParts.join(',').trim(),
  };
}

function formatTimeValue(value: string) {
  const digits = value.replace(/\D/g, '');
  let formatted = '';

  if (digits.length > 0) {
    formatted += digits.substring(0, 2);
  }

  if (digits.length >= 3) {
    formatted += `:${digits.substring(2, 4)}`;
  }

  return formatted;
}

function formatDateValue(value: string) {
  const digits = value.replace(/\D/g, '');
  let formatted = '';

  if (digits.length > 0) {
    formatted += digits.substring(0, 2);
  }

  if (digits.length >= 3) {
    formatted += `/${digits.substring(2, 4)}`;
  }

  if (digits.length >= 5) {
    formatted += `/${digits.substring(4, 8)}`;
  }

  return formatted;
}

function formatDateToDisplay(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateToApi(date: string) {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}

function buildSpecialDatePeriods(day: AtypicalDayForm | AtypicalDayObject) {
  if (!day.is_working_day) {
    return [];
  }

  const periods = [];

  if (day.open && day.break_start) {
    periods.push({
      startTime: day.open,
      endTime: day.break_start,
    });
  }

  if (day.break_end && day.close) {
    periods.push({
      startTime: day.break_end,
      endTime: day.close,
    });
  }

  if (periods.length === 0 && day.open && day.close) {
    periods.push({
      startTime: day.open,
      endTime: day.close,
    });
  }

  return periods;
}

export default function ClinicSettingsPage() {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [clinicServices, setClinicServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { clinicInfo } = useUser();
  const [clinicName, setClinicName] = useState('');
  const [aiAgentName, setAiAgentName] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [clinicNameError, setClinicNameError] = useState(false);
  const [aiAgentNameError, setAiAgentNameError] = useState(false);
  const [appointmentDuration, setAppointmentDuration] = useState('');
  const [maxAppointmentsPerSlot, setMaxAppointmentsPerSlot] = useState('');
  const [clinicType, setClinicType] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicAddressNumber, setClinicAddressNumber] = useState('');
  const [clinicPostalCode, setClinicPostalCode] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [chargesEvaluation, setChargesEvaluation] = useState(false);
  const [evaluationPriceCents, setEvaluationPriceCents] = useState(0);
  const [activeTab, setActiveTab] = useState<'dados' | 'servicos' | 'horarios' | 'dias-atipicos'>(
    'dados',
  );
  const [isAtypicalFormOpen, setIsAtypicalFormOpen] = useState(false);
  const [atypicalDayConfig, setAtypicalDayConfig] =
    useState<AtypicalDayForm>(EMPTY_ATYPICAL_DAY_FORM);
  const [atypicalDaysList, setAtypicalDaysList] = useState<AtypicalDayObject[]>([]);

  const showToastMessage = ({
    success,
    successMessage,
    errorMessage,
  }: {
    success: boolean;
    successMessage: string;
    errorMessage: string;
  }) => {
    toast(success ? successMessage : errorMessage, {
      type: success ? 'success' : 'error',
      theme: 'colored',
    });
  };

  const fetchClinicAvailability = async () => {
    if (!clinicInfo?.clinicId) return;

    setLoading(true);

    try {
      const response = await getClinicWorkingHours(clinicInfo.clinicId);
      const clinicWorkingHours = response?.clinicWorkingHour ?? [];

      setWorkingHours(
        clinicWorkingHours.map((workingHour: WorkingHour) => ({
          weekday: workingHour.weekday,
          startTime: workingHour.startTime,
          endTime: workingHour.endTime,
        })),
      );
    } catch {
      toast('Erro ao carregar horarios de funcionamento.', {
        type: 'error',
        theme: 'colored',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAtypicalDaysList = async () => {
    if (!clinicInfo?.clinicId) return;

    try {
      const response = await getAtypicalDaysList(clinicInfo.clinicId);
      const specialDates = response?.specialDates ?? [];

      setAtypicalDaysList(
        specialDates.map(
          (item: {
            date: string;
            isOpen: boolean;
            note: string | null;
            periods: { startTime: string; endTime: string }[];
          }) => {
            const firstPeriod = item.periods[0];
            const secondPeriod = item.periods[1];

            return {
              specialDate: item.date,
              exception_day: formatDateToDisplay(item.date),
              is_working_day: item.isOpen,
              note: item.note ?? '',
              open: firstPeriod?.startTime ?? '',
              break_start: secondPeriod ? (firstPeriod?.endTime ?? '') : '',
              break_end: secondPeriod?.startTime ?? '',
              close: secondPeriod?.endTime ?? firstPeriod?.endTime ?? '',
            };
          },
        ),
      );
    } catch {
      toast('Erro ao carregar dias atipicos.', {
        type: 'error',
        theme: 'colored',
      });
    }
  };

  const fetchClinicServices = async () => {
    if (!clinicInfo?.clinicId) return;

    try {
      const response = await getClinicServices(clinicInfo.clinicId);
      setClinicServices(
        (response?.services ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents ?? 0,
        })),
      );
    } catch {
      toast('Erro ao carregar serviços.', {
        type: 'error',
        theme: 'colored',
      });
    }
  };

  const handlePostalCodeChange = (value: string) => {
    const cleanedPostalCode = value.replace(/\D/g, '');
    if (cleanedPostalCode.length > 8) return;
    setClinicPostalCode(formatPostalCode(cleanedPostalCode));
  };

  const findAddressByPostalCode = async () => {
    const postalCodeWithoutDash = clinicPostalCode.replace('-', '');
    if (postalCodeWithoutDash.length < 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${postalCodeWithoutDash}/json/`);
      const data = await response.json();

      if (data?.erro) {
        toast('CEP nao encontrado. Verifique e tente novamente.', {
          type: 'error',
          theme: 'colored',
        });
        return;
      }

      setClinicAddress(data.logradouro ?? '');
      setClinicCity(data.localidade ?? '');
      setClinicState(data.estado ?? data.uf ?? '');
    } catch {
      toast('Erro ao buscar endereco pelo CEP. Tente novamente.', {
        type: 'error',
        theme: 'colored',
      });
    }
  };

  const handleSaveClinicBasicData = async () => {
    const normalizedClinicName = clinicName.trim();
    const normalizedAiAgentName = aiAgentName.trim();
    const requiredFields = [
      normalizedClinicName,
      normalizedAiAgentName,
      appointmentDuration,
      maxAppointmentsPerSlot,
      clinicType,
      clinicAddress.trim(),
      clinicAddressNumber.trim(),
      clinicPostalCode.trim(),
      clinicCity.trim(),
      clinicState.trim(),
    ];
    const clinicError = !normalizedClinicName;
    const agentError = !normalizedAiAgentName;
    const hasEmptyRequiredField = requiredFields.some((value) => !value);
    const hasInvalidEvaluationPrice = chargesEvaluation && evaluationPriceCents <= 0;

    setClinicNameError(clinicError);
    setAiAgentNameError(agentError);

    if (hasEmptyRequiredField || hasInvalidEvaluationPrice) {
      toast('Preencha os campos obrigatorios.', {
        type: 'error',
        theme: 'colored',
      });
      return;
    }

    if (!clinicInfo?.clinicId) {
      toast('Nao foi possivel identificar a clinica. Recarregue a pagina.', {
        type: 'error',
        theme: 'colored',
      });
      return;
    }

    try {
      await putClinicConfiguration({
        clinicId: clinicInfo.clinicId,
        clinicName: normalizedClinicName,
        clinicType: clinicType || undefined,
        aiAgentName: normalizedAiAgentName,
        appointmentDurationMinutes: Number(appointmentDuration) || 0,
        maxAppointmentsPerSlot: Number(maxAppointmentsPerSlot) || 1,
        chargesEvaluation,
        evaluationPriceCents: chargesEvaluation ? evaluationPriceCents : 0,
        allowRescheduling: true,
        allowCancellation: true,
        address: `${clinicAddress.trim()}, ${clinicAddressNumber.trim()}`,
        postalCode: clinicPostalCode.trim() || null,
        city: clinicCity.trim() || null,
        state: clinicState.trim() || null,
        additionalInformation: additionalInformation.trim() || null,
      });

      showToastMessage({
        success: true,
        successMessage: 'Dados da clinica salvos com sucesso.',
        errorMessage: 'Erro ao salvar os dados da clinica.',
      });
    } catch (saveError: any) {
      const backendMessage =
        saveError?.response?.data?.message ?? 'Erro ao salvar os dados da clinica.';
      toast(backendMessage, { type: 'error', theme: 'colored' });
    }
  };

  const handleSaveConfiguration = async () => {
    if (!clinicInfo?.clinicId) return;

    try {
      await putClinicAvailability(clinicInfo.clinicId, workingHours);

      showToastMessage({
        success: true,
        successMessage: 'Configuracoes atualizadas com sucesso.',
        errorMessage: 'Houve um erro ao atualizar as configuracoes.',
      });

      await fetchClinicAvailability();
    } catch {
      showToastMessage({
        success: false,
        successMessage: 'Configuracoes atualizadas com sucesso.',
        errorMessage: 'Houve um erro ao atualizar as configuracoes.',
      });
    }
  };

  const handleSaveServices = async () => {
    if (!clinicInfo?.clinicId) return;

    try {
      const response = await putClinicServices(
        clinicInfo.clinicId,
        clinicServices.map((service) => ({
          id: service.id,
          name: service.name.trim(),
          durationMinutes: service.durationMinutes || 0,
          priceCents: service.priceCents ?? 0,
        })),
      );

      setClinicServices(
        (response?.services ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents ?? 0,
        })),
      );

      showToastMessage({
        success: true,
        successMessage: 'Serviços salvos com sucesso.',
        errorMessage: 'Houve um erro ao salvar os serviços.',
      });
    } catch {
      showToastMessage({
        success: false,
        successMessage: 'Serviços salvos com sucesso.',
        errorMessage: 'Houve um erro ao salvar os serviços.',
      });
    }
  };

  const handleCloseAtypicalDayForm = () => {
    setIsAtypicalFormOpen(false);
    setAtypicalDayConfig(EMPTY_ATYPICAL_DAY_FORM);
  };

  const handleManageAtypicalDay = (objectKey: keyof AtypicalDayForm, value: string | boolean) => {
    setAtypicalDayConfig((previousConfig) => {
      if (
        objectKey === 'open' ||
        objectKey === 'close' ||
        objectKey === 'break_start' ||
        objectKey === 'break_end'
      ) {
        return { ...previousConfig, [objectKey]: formatTimeValue(String(value)) };
      }

      if (objectKey === 'exception_day') {
        return { ...previousConfig, [objectKey]: formatDateValue(String(value)) };
      }

      if (objectKey === 'note') {
        return { ...previousConfig, note: String(value) };
      }

      return { ...previousConfig, [objectKey]: Boolean(value) };
    });
  };

  const saveAtypicalConfiguration = async () => {
    if (!clinicInfo?.clinicId) return;

    const specialDate = formatDateToApi(atypicalDayConfig.exception_day);

    try {
      await postAtypicalDayAvailability({
        clinicId: clinicInfo.clinicId,
        specialDate,
        isOpen: atypicalDayConfig.is_working_day,
        note: atypicalDayConfig.note.trim() || undefined,
        periods: buildSpecialDatePeriods(atypicalDayConfig),
      });

      handleCloseAtypicalDayForm();
      await fetchAtypicalDaysList();

      showToastMessage({
        success: true,
        successMessage: 'Dia atipico criado com sucesso.',
        errorMessage: 'Houve um erro ao criar o dia atipico.',
      });
    } catch {
      showToastMessage({
        success: false,
        successMessage: 'Dia atipico criado com sucesso.',
        errorMessage: 'Houve um erro ao criar o dia atipico.',
      });
    }
  };

  const handleChangeAtypicalDayCard = (
    specialDate: string,
    objectKey: keyof AtypicalDayObject,
    value: string | boolean,
  ) => {
    setAtypicalDaysList((previousDays) =>
      previousDays.map((day) => {
        if (day.specialDate !== specialDate) return day;

        if (objectKey === 'exception_day') {
          return { ...day, exception_day: formatDateValue(String(value)) };
        }

        if (objectKey === 'note') {
          return { ...day, note: String(value) };
        }

        if (
          objectKey === 'open' ||
          objectKey === 'close' ||
          objectKey === 'break_start' ||
          objectKey === 'break_end'
        ) {
          return { ...day, [objectKey]: formatTimeValue(String(value)) };
        }

        return { ...day, [objectKey]: value };
      }),
    );
  };

  const handleSaveNewAtypicalDayValue = async (specialDate: string) => {
    if (!clinicInfo?.clinicId) return;

    const atypicalDayToUpdate = atypicalDaysList.find(
      (atypicalDay) => atypicalDay.specialDate === specialDate,
    );

    if (!atypicalDayToUpdate) return;

    const nextSpecialDate = formatDateToApi(atypicalDayToUpdate.exception_day);

    try {
      if (nextSpecialDate !== specialDate) {
        await deleteAtypicalDay(clinicInfo.clinicId, specialDate);
        await postAtypicalDayAvailability({
          clinicId: clinicInfo.clinicId,
          specialDate: nextSpecialDate,
          isOpen: atypicalDayToUpdate.is_working_day,
          note: atypicalDayToUpdate.note.trim() || undefined,
          periods: buildSpecialDatePeriods(atypicalDayToUpdate),
        });
      } else {
        await putUpdateAtypicalDay(
          {
            isOpen: atypicalDayToUpdate.is_working_day,
            note: atypicalDayToUpdate.note.trim() || undefined,
            periods: buildSpecialDatePeriods(atypicalDayToUpdate),
          },
          clinicInfo.clinicId,
          specialDate,
        );
      }

      await fetchAtypicalDaysList();

      showToastMessage({
        success: true,
        successMessage: 'Dia atualizado com sucesso.',
        errorMessage: 'Houve um erro ao atualizar o dia selecionado.',
      });
    } catch {
      showToastMessage({
        success: false,
        successMessage: 'Dia atualizado com sucesso.',
        errorMessage: 'Houve um erro ao atualizar o dia selecionado.',
      });
    }
  };

  const handleDeleteAtypicalDay = async (specialDate: string) => {
    if (!clinicInfo?.clinicId) return;

    try {
      await deleteAtypicalDay(clinicInfo.clinicId, specialDate);
      await fetchAtypicalDaysList();

      showToastMessage({
        success: true,
        successMessage: 'Dia atipico deletado com sucesso.',
        errorMessage: 'Houve um erro ao deletar o dia atipico.',
      });
    } catch {
      showToastMessage({
        success: false,
        successMessage: 'Dia atipico deletado com sucesso.',
        errorMessage: 'Houve um erro ao deletar o dia atipico.',
      });
    }
  };

  const fetchClinicConfiguration = async () => {
    if (!clinicInfo?.clinicId) return;

    const response = await getClinicConfiguration(clinicInfo.clinicId);

    if (response) {
      setClinicName(response.clinicName || '');
      setAiAgentName(response.aiAgentName || '');
      setAppointmentDuration(
        response.appointmentDurationMinutes !== null &&
          response.appointmentDurationMinutes !== undefined
          ? String(response.appointmentDurationMinutes)
          : '',
      );
      setMaxAppointmentsPerSlot(
        response.maxAppointmentsPerSlot !== null && response.maxAppointmentsPerSlot !== undefined
          ? String(response.maxAppointmentsPerSlot)
          : '',
      );
      setClinicType(response.clinicType || '');
      const { street, number } = splitAddressAndNumber(response.address);
      setClinicAddress(street);
      setClinicAddressNumber(number);
      setClinicPostalCode(response.postalCode ? formatPostalCode(response.postalCode) : '');
      setClinicCity(response.city || '');
      setClinicState(response.state || '');
      setAdditionalInformation(response.additionalInformation || '');
      setChargesEvaluation(Boolean(response.chargesEvaluation));
      setEvaluationPriceCents(response.evaluationPriceCents ?? 0);
    }
  };

  useEffect(() => {
    fetchClinicConfiguration();
    fetchClinicAvailability();
    fetchClinicServices();
    fetchAtypicalDaysList();
  }, [clinicInfo?.clinicId]);

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.header}>
        <h1>Configurações da clínica</h1>
        <p className={styles.subtitle}>
          Gerencie os dados e horários de funcionamento da sua clínica.
        </p>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'dados' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          Dados da clínica
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'servicos' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('servicos')}
        >
          Serviços
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'horarios' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('horarios')}
        >
          Horários
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'dias-atipicos' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('dias-atipicos')}
        >
          Dias atipicos
        </button>
      </div>

      {activeTab === 'dados' && (
        <ClinicDataSectionComponent
          clinicName={clinicName}
          setClinicName={setClinicName}
          aiAgentName={aiAgentName}
          setAiAgentName={setAiAgentName}
          additionalInformation={additionalInformation}
          setAdditionalInformation={setAdditionalInformation}
          appointmentDuration={appointmentDuration}
          setAppointmentDuration={setAppointmentDuration}
          maxAppointmentsPerSlot={maxAppointmentsPerSlot}
          setMaxAppointmentsPerSlot={setMaxAppointmentsPerSlot}
          aiAgentNameError={aiAgentNameError}
          setAiAgentNameError={setAiAgentNameError}
          clinicNameError={clinicNameError}
          setClinicNameError={setClinicNameError}
          clinicTypeOptions={CLINIC_TYPE_OPTIONS}
          clinicType={clinicType}
          setClinicType={setClinicType}
          clinicAddress={clinicAddress}
          setClinicAddress={setClinicAddress}
          clinicAddressNumber={clinicAddressNumber}
          setClinicAddressNumber={setClinicAddressNumber}
          handleSaveClinicBasicData={handleSaveClinicBasicData}
          findAddressByPostalCode={findAddressByPostalCode}
          handlePostalCodeChange={handlePostalCodeChange}
          clinicPostalCode={clinicPostalCode}
          setClinicPostalCode={setClinicPostalCode}
          clinicCity={clinicCity}
          setClinicCity={setClinicCity}
          clinicState={clinicState}
          setClinicState={setClinicState}
          chargesEvaluation={chargesEvaluation}
          setChargesEvaluation={setChargesEvaluation}
          evaluationPriceCents={evaluationPriceCents}
          setEvaluationPriceCents={setEvaluationPriceCents}
        />
      )}

      {activeTab === 'servicos' && (
        <div className={styles.containerWrapped}>
          <ClinicServicesSectionComponent
            services={clinicServices}
            setServices={setClinicServices}
            handleSaveServices={handleSaveServices}
          />
        </div>
      )}

      {activeTab === 'horarios' && loading && (
        <div className={styles.containerWrapped}>
          <div className={styles.containerSkeleton}></div>
        </div>
      )}

      {activeTab === 'horarios' && !loading && (
        <div className={styles.containerWrapped}>
          <div className={styles.workingHoursCard}>
            <RegisterClinicWorkingHours
              workingHours={workingHours}
              setWorkingHours={setWorkingHours}
            />
          </div>

          <div className={styles.containerButton}>
            <ButtonComponent text="Salvar" handleClickButton={handleSaveConfiguration} />
          </div>
        </div>
      )}

      {activeTab === 'dias-atipicos' && (
        <div className={styles.containerWrapped}>
          {isAtypicalFormOpen && (
            <BaseModalComponent handleCloseModal={handleCloseAtypicalDayForm}>
              <div className={styles.atypicalModalContent}>
                <div className={styles.atypicalFormHeader}>
                  <h2>Novo dia atipico</h2>
                  <p>Configure uma excecao de atendimento para uma data especifica.</p>
                </div>
                <div className={styles.atypicalModalForm}>
                  <InputComponent
                    label="Data"
                    value={atypicalDayConfig.exception_day}
                    handleChangeInput={(event) =>
                      handleManageAtypicalDay('exception_day', event.target.value)
                    }
                    placeholder="DD/MM/AAAA"
                  />
                  <div className={styles.atypicalModalSwitch}>
                    <span>Clínica aberta nesta data?</span>
                    <SwitchComponent
                      isOn={atypicalDayConfig.is_working_day}
                      handleToggle={() =>
                        handleManageAtypicalDay('is_working_day', !atypicalDayConfig.is_working_day)
                      }
                    />
                  </div>
                  <div className={styles.atypicalModalTimes}>
                    <InputComponent
                      label="Abertura"
                      value={atypicalDayConfig.open}
                      disabled={!atypicalDayConfig.is_working_day}
                      handleChangeInput={(event) =>
                        handleManageAtypicalDay('open', event.target.value)
                      }
                      placeholder="00:00"
                    />
                    <InputComponent
                      label="Pausa"
                      value={atypicalDayConfig.break_start}
                      disabled={!atypicalDayConfig.is_working_day}
                      handleChangeInput={(event) =>
                        handleManageAtypicalDay('break_start', event.target.value)
                      }
                      placeholder="00:00"
                    />
                    <InputComponent
                      label="Retorno"
                      value={atypicalDayConfig.break_end}
                      disabled={!atypicalDayConfig.is_working_day}
                      handleChangeInput={(event) =>
                        handleManageAtypicalDay('break_end', event.target.value)
                      }
                      placeholder="00:00"
                    />
                    <InputComponent
                      label="Fechamento"
                      value={atypicalDayConfig.close}
                      disabled={!atypicalDayConfig.is_working_day}
                      handleChangeInput={(event) =>
                        handleManageAtypicalDay('close', event.target.value)
                      }
                      placeholder="00:00"
                    />
                  </div>
                  <div className={styles.atypicalModalNote}>
                    <label>Observação</label>
                    <textarea
                      value={atypicalDayConfig.note}
                      onChange={(event) => handleManageAtypicalDay('note', event.target.value)}
                      placeholder="Ex.: Feriado municipal, manutenção interna, evento da clínica..."
                    />
                  </div>
                </div>
                <div className={styles.atypicalModalActions}>
                  <ButtonComponent
                    style={{ background: 'var(--red-300)' }}
                    text="Cancelar"
                    handleClickButton={handleCloseAtypicalDayForm}
                  />
                  <ButtonComponent text="Salvar" handleClickButton={saveAtypicalConfiguration} />
                </div>
              </div>
            </BaseModalComponent>
          )}

          <div className={styles.atypicalTabActions}>
            <ButtonComponent
              text="Adicionar dia atipico"
              handleClickButton={() => setIsAtypicalFormOpen(true)}
            />
          </div>
          <div className={styles.atypicalDaysList}>
            <div className={styles.atypicalDaysHeader}>
              <h2>Lista de dias atipicos</h2>
            </div>
            <ul className={styles.atypicalDaysUl}>
              {atypicalDaysList.length > 0 ? (
                atypicalDaysList.map((atypicalDay) => (
                  <li className={styles.atypicalDayCard} key={atypicalDay.specialDate}>
                    <div className={styles.atypicalDayInput}>
                      <InputComponent
                        value={atypicalDay.exception_day}
                        handleChangeInput={(event) =>
                          handleChangeAtypicalDayCard(
                            atypicalDay.specialDate,
                            'exception_day',
                            event.target.value,
                          )
                        }
                        placeholder="DD/MM/AAAA"
                      />
                    </div>
                    <SwitchComponent
                      handleToggle={() =>
                        handleChangeAtypicalDayCard(
                          atypicalDay.specialDate,
                          'is_working_day',
                          !atypicalDay.is_working_day,
                        )
                      }
                      isOn={atypicalDay.is_working_day}
                    />
                    {(['open', 'break_start', 'break_end', 'close'] as const).map((field) => (
                      <div className={styles.atypicalDayTime} key={field}>
                        <InputComponent
                          value={atypicalDay[field]}
                          disabled={!atypicalDay.is_working_day}
                          handleChangeInput={(event) =>
                            handleChangeAtypicalDayCard(
                              atypicalDay.specialDate,
                              field,
                              event.target.value,
                            )
                          }
                          placeholder="00:00"
                        />
                      </div>
                    ))}
                    <div className={styles.atypicalDayNote}>
                      <label>Observação</label>
                      <textarea
                        value={atypicalDay.note}
                        onChange={(event) =>
                          handleChangeAtypicalDayCard(
                            atypicalDay.specialDate,
                            'note',
                            event.target.value,
                          )
                        }
                        placeholder="Observação opcional"
                      />
                    </div>
                    <div className={styles.deleteAtypicalButtonContainer}>
                      <ButtonComponent
                        style={{ background: 'var(--red-300)' }}
                        handleClickButton={() => handleDeleteAtypicalDay(atypicalDay.specialDate)}
                        text="Excluir"
                      />
                      <ButtonComponent
                        handleClickButton={() =>
                          handleSaveNewAtypicalDayValue(atypicalDay.specialDate)
                        }
                        text="Salvar"
                      />
                    </div>
                  </li>
                ))
              ) : (
                <div className={styles.emptyContentContainer}>
                  <p>Nao existem dias atipicos configurados.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
