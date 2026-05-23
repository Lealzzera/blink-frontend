'use client';

import { deleteAtypicalDay } from '@/app/actions/deleteAtypicalDay';
import { getAtypicalDaysList } from '@/app/actions/getAtypicalDaysList';
import { getClinicConfiguration } from '@/app/actions/getClinicConfiguration';
import { getClinicWorkingHours } from '@/app/actions/getClinicWorkingHours';
import postAtypicalDayAvailability from '@/app/actions/postAtypicalDayAvailability';
import {
  putClinicAvailability,
  PutClinicAvailabilityType,
} from '@/app/actions/putClinicAvailability';
import { putClinicConfiguration } from '@/app/actions/putClinicConfiguration';
import putUpdateAtypicalDay from '@/app/actions/putUpdateAtypicalDay';
import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import InputComponent from '@/app/components/InputComponent/InputComponent';
import SwitchComponent from '@/app/components/SwitchComponent/SwitchComponent';
import { useUser } from '@/app/context/userContext';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import ClinicDataSectionComponent from './components/ClinicDataSectionComponent/ClinicDataSectionComponent';
import styles from './style.module.css';

type ClinicDay = {
  weekday: string;
  isWorkDay: boolean;
  open: string;
  close: string;
  break_start: string;
  break_end: string;
};

type AtypicalDayObject = {
  specialDate: string;
  exception_day: string;
  is_working_day: boolean;
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

const WEEKDAY_LABEL_BY_VALUE: Record<string, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terca',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sabado',
  SUNDAY: 'Domingo',
};

const WEEKDAY_VALUE_BY_LABEL = Object.entries(WEEKDAY_LABEL_BY_VALUE).reduce(
  (accumulator, [weekdayValue, weekdayLabel]) => ({
    ...accumulator,
    [weekdayLabel]: weekdayValue,
  }),
  {} as Record<string, string>,
);

const DEFAULT_WEEK_DAYS: ClinicDay[] = Object.values(WEEKDAY_LABEL_BY_VALUE).map((weekday) => ({
  weekday,
  isWorkDay: false,
  open: '',
  close: '',
  break_start: '',
  break_end: '',
}));

const EMPTY_ATYPICAL_DAY_FORM: AtypicalDayForm = {
  exception_day: '',
  is_working_day: false,
  open: '',
  close: '',
  break_start: '',
  break_end: '',
};

function formatPostalCode(value: string) {
  const cleanedPostalCode = value.replace(/\D/g, '');
  return cleanedPostalCode.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
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

function buildWorkingHourPeriods(day: ClinicDay): PutClinicAvailabilityType[] {
  const weekday = WEEKDAY_VALUE_BY_LABEL[day.weekday];

  if (!day.isWorkDay) {
    return [];
  }

  if (day.open && day.break_start && day.break_end && day.close) {
    return [
      {
        weekday,
        startTime: day.open,
        endTime: day.break_start,
      },
      {
        weekday,
        startTime: day.break_end,
        endTime: day.close,
      },
    ];
  }

  if (day.open && day.close) {
    return [
      {
        weekday,
        startTime: day.open,
        endTime: day.close,
      },
    ];
  }

  return [];
}

export default function ClinicSettingsPage() {
  const [defaultDays, setDefaultDays] = useState<ClinicDay[]>(DEFAULT_WEEK_DAYS);
  const [loading, setLoading] = useState(true);
  const { clinicInfo } = useUser();
  const [clinicName, setClinicName] = useState('');
  const [aiAgentName, setAiAgentName] = useState('');
  const [clinicNameError, setClinicNameError] = useState(false);
  const [aiAgentNameError, setAiAgentNameError] = useState(false);
  const [appointmentDuration, setAppointmentDuration] = useState('');
  const [maxAppointmentsPerSlot, setMaxAppointmentsPerSlot] = useState('');
  const [clinicType, setClinicType] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPostalCode, setClinicPostalCode] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [activeTab, setActiveTab] = useState<'dados' | 'horarios'>('dados');
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
      const workingHours = response?.clinicWorkingHour ?? [];
      const workingHoursByWeekday = new Map<
        string,
        { weekday: string; startTime: string; endTime: string }[]
      >();

      for (const workingHour of workingHours as {
        weekday: string;
        startTime: string;
        endTime: string;
      }[]) {
        const weekdayPeriods = workingHoursByWeekday.get(workingHour.weekday) ?? [];
        workingHoursByWeekday.set(workingHour.weekday, [...weekdayPeriods, workingHour]);
      }

      setDefaultDays(
        DEFAULT_WEEK_DAYS.map((day) => {
          const weekdayValue = WEEKDAY_VALUE_BY_LABEL[day.weekday];
          const weekdayPeriods = workingHoursByWeekday.get(weekdayValue) ?? [];
          const firstPeriod = weekdayPeriods[0];
          const secondPeriod = weekdayPeriods[1];

          return {
            ...day,
            isWorkDay: weekdayPeriods.length > 0,
            open: firstPeriod?.startTime ?? '',
            break_start: secondPeriod ? firstPeriod?.endTime ?? '' : '',
            break_end: secondPeriod?.startTime ?? '',
            close: secondPeriod?.endTime ?? firstPeriod?.endTime ?? '',
          };
        }),
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
            periods: { startTime: string; endTime: string }[];
          }) => {
            const firstPeriod = item.periods[0];
            const secondPeriod = item.periods[1];

            return {
              specialDate: item.date,
              exception_day: formatDateToDisplay(item.date),
              is_working_day: item.isOpen,
              open: firstPeriod?.startTime ?? '',
              break_start: secondPeriod ? firstPeriod?.endTime ?? '' : '',
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

  const handleUpdateProperty = ({
    weekday,
    key,
    value,
  }: {
    key: keyof ClinicDay;
    value: string | boolean;
    weekday: string;
  }) => {
    setDefaultDays((previousDays) =>
      previousDays.map((day) => {
        if (day.weekday !== weekday) return day;

        if (key === 'open' || key === 'close' || key === 'break_start' || key === 'break_end') {
          return { ...day, [key]: formatTimeValue(String(value)) };
        }

        return { ...day, [key]: value };
      }),
    );
  };

  const handleSaveClinicBasicData = async () => {
    const normalizedClinicName = clinicName.trim();
    const normalizedAiAgentName = aiAgentName.trim();
    const clinicError = normalizedClinicName.length === 0;
    const agentError = normalizedAiAgentName.length === 0;

    setClinicNameError(clinicError);
    setAiAgentNameError(agentError);

    if (clinicError || agentError) {
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
        chargesEvaluation: false,
        evaluationPriceCents: 0,
        allowRescheduling: true,
        allowCancellation: true,
        address: clinicAddress.trim() || null,
        postalCode: clinicPostalCode.trim() || null,
        city: clinicCity.trim() || null,
        state: clinicState.trim() || null,
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

    const workingHours = defaultDays.flatMap((day) => buildWorkingHourPeriods(day));

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
          periods: buildSpecialDatePeriods(atypicalDayToUpdate),
        });
      } else {
        await putUpdateAtypicalDay(
          {
            isOpen: atypicalDayToUpdate.is_working_day,
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
      setClinicAddress(response.address || '');
      setClinicPostalCode(response.postalCode ? formatPostalCode(response.postalCode) : '');
      setClinicCity(response.city || '');
      setClinicState(response.state || '');
    }
  };

  useEffect(() => {
    fetchClinicConfiguration();
    fetchClinicAvailability();
    fetchAtypicalDaysList();
  }, [clinicInfo?.clinicId]);

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.header}>
        <h1>Configuracoes da clinica</h1>
        <p className={styles.subtitle}>
          Gerencie os dados e horarios de funcionamento da sua clinica.
        </p>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'dados' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          Dados da clinica
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'horarios' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('horarios')}
        >
          Horarios de funcionamento
        </button>
      </div>

      {activeTab === 'dados' && (
        <ClinicDataSectionComponent
          clinicName={clinicName}
          setClinicName={setClinicName}
          aiAgentName={aiAgentName}
          setAiAgentName={setAiAgentName}
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
          handleSaveClinicBasicData={handleSaveClinicBasicData}
          findAddressByPostalCode={findAddressByPostalCode}
          handlePostalCodeChange={handlePostalCodeChange}
          clinicPostalCode={clinicPostalCode}
          setClinicPostalCode={setClinicPostalCode}
          clinicCity={clinicCity}
          setClinicCity={setClinicCity}
          clinicState={clinicState}
          setClinicState={setClinicState}
        />
      )}

      {activeTab === 'horarios' && loading && (
        <div className={styles.containerWrapped}>
          <div className={styles.containerSkeleton}></div>
        </div>
      )}

      {activeTab === 'horarios' && !loading && (
        <div className={styles.containerWrapped}>
          {isAtypicalFormOpen && (
            <div className={styles.containerContent}>
              <div className={styles.containerLegend}>
                <p>Data</p>
                <p>Ativar</p>
                <p>Abertura</p>
                <p>Pausa</p>
                <p>Retorno</p>
                <p>Fechamento</p>
              </div>
              <ul className={styles.listDays}>
                <li>
                  <div className={styles.atypicalDayInput}>
                    <InputComponent
                      value={atypicalDayConfig.exception_day}
                      handleChangeInput={(event) =>
                        handleManageAtypicalDay('exception_day', event.target.value)
                      }
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <SwitchComponent
                    isOn={atypicalDayConfig.is_working_day}
                    handleToggle={() =>
                      handleManageAtypicalDay(
                        'is_working_day',
                        !atypicalDayConfig.is_working_day,
                      )
                    }
                  />
                  {(['open', 'break_start', 'break_end', 'close'] as const).map((field) => (
                    <div className={styles.inputContainer} key={field}>
                      <InputComponent
                        value={atypicalDayConfig[field]}
                        disabled={!atypicalDayConfig.is_working_day}
                        handleChangeInput={(event) =>
                          handleManageAtypicalDay(field, event.target.value)
                        }
                        placeholder="00:00"
                      />
                    </div>
                  ))}
                </li>
              </ul>
              <div className={styles.deleteAtypicalButtonContainer}>
                <ButtonComponent
                  style={{ background: 'var(--red-300)' }}
                  text="Cancelar"
                  handleClickButton={handleCloseAtypicalDayForm}
                />
                <ButtonComponent text="Salvar" handleClickButton={saveAtypicalConfiguration} />
              </div>
            </div>
          )}

          <div className={styles.containerContent}>
            <div className={styles.containerLegend}>
              <p>Dia da semana</p>
              <p>Ativar</p>
              <p>Abertura</p>
              <p>Pausa</p>
              <p>Retorno</p>
              <p>Fechamento</p>
            </div>
            <ul className={styles.listDays}>
              {defaultDays.map((day) => (
                <li key={day.weekday}>
                  <p>{day.weekday}</p>
                  <SwitchComponent
                    isOn={day.isWorkDay}
                    handleToggle={() =>
                      handleUpdateProperty({
                        key: 'isWorkDay',
                        weekday: day.weekday,
                        value: !day.isWorkDay,
                      })
                    }
                  />
                  {(['open', 'break_start', 'break_end', 'close'] as const).map((field) => (
                    <div className={styles.inputContainer} key={field}>
                      <InputComponent
                        label=""
                        placeholder="00:00"
                        value={day[field]}
                        disabled={!day.isWorkDay}
                        handleChangeInput={(event) =>
                          handleUpdateProperty({
                            key: field,
                            weekday: day.weekday,
                            value: event.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.containerButton}>
            <div className={styles.atypicalDayButton}>
              <p onClick={() => setIsAtypicalFormOpen(true)}>Adicionar dia atipico</p>
            </div>
            <ButtonComponent text="Salvar" handleClickButton={handleSaveConfiguration} />
          </div>

          <div className={styles.atypicalDaysList}>
            <h2>Lista de dias atipicos</h2>
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
