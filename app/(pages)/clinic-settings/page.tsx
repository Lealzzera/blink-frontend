"use client";

import SwitchComponent from "@/app/components/SwitchComponent/SwitchComponent";
import styles from "./style.module.css";
import { useEffect, useState } from "react";
import InputComponent from "@/app/components/InputComponent/InputComponent";
import { useUser } from "@/app/context/userContext";
import { PutClinicAvailabilityType } from "@/app/actions/putClinicAvailability";
import ButtonComponent from "@/app/components/ButtonComponent/ButtonComponent";
import { putClinicAvailability } from "@/app/actions/putClinicAvailability";
import { getClinicAvailability } from "@/app/actions/getClinicAvailability";
import { toast, ToastContainer } from "react-toastify";
import BaseModalComponent from "@/app/components/BaseModalComponent/BaseModalComponent";
import AtypicalDayModalContent from "./AtypicalDayModalContent/AtypicalDayModalContent";
import postAtypicalDayAvailability from "@/app/actions/postAtypicalDayAvailability";
import { getAtypicalDaysList } from "@/app/actions/getAtypicalDaysList";
import { deleteAtypicalDay } from "@/app/actions/deleteAtypicalDay";
import putUpdateAtypicalDay from "@/app/actions/putUpdateAtypicalDay";

type ClinicDay = {
  week_day: string;
  is_work_day: boolean;
  open?: string;
  close?: string;
  break_start?: string;
  break_end?: string;
};

type AtypicalDayObject = {
  id: number;
  clinic_id: number;
  exception_day: string;
  is_working_day: boolean;
  open: string;
  close: string;
  break_start: string;
  break_end: string;
};

export default function ClinicSettingsPage() {
  const [defaultDays, setDefaultDays] = useState<ClinicDay[]>([]);
  const [loading, setLoading] = useState(true);
  const { clinicId } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [atypicalDayConfig, setAtypicalDayConfig] = useState({
    clinic_id: clinicId,
    exception_day: "",
    is_working_day: false,
    open: "",
    close: "",
    break_start: "",
    break_end: "",
  });
  const [atypicalDaysList, setAtypicalDaysList] = useState<AtypicalDayObject[]>(
    []
  );

  const fetchClinicAvailability = async () => {
    setLoading(true);
    const response = await getClinicAvailability();
    if (!response) return;
    const formattedResponse: ClinicDay[] = response.map((day: ClinicDay) => {
      const w = String(day.week_day || "").toUpperCase();
      switch (w) {
        case "SEGUNDA":
          return { ...day, week_day: "Segunda" } as ClinicDay;
        case "TERCA":
          return { ...day, week_day: "Terça" } as ClinicDay;
        case "QUARTA":
          return { ...day, week_day: "Quarta" } as ClinicDay;
        case "QUINTA":
          return { ...day, week_day: "Quinta" } as ClinicDay;
        case "SEXTA":
          return { ...day, week_day: "Sexta" } as ClinicDay;
        case "SABADO":
          return { ...day, week_day: "Sábado" } as ClinicDay;
        case "DOMINGO":
          return { ...day, week_day: "Domingo" } as ClinicDay;
        default:
          return {
            week_day: String(day.week_day || ""),
            is_work_day: Boolean(day.is_work_day),
            open: day.open ?? undefined,
            close: day.close ?? undefined,
            break_start: day.break_start ?? undefined,
            break_end: day.break_end ?? undefined,
          } as ClinicDay;
      }
    });

    const weekOrder = [
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
      "Domingo",
    ];

    const sortedDays = formattedResponse.sort((a: ClinicDay, b: ClinicDay) => {
      return weekOrder.indexOf(a.week_day) - weekOrder.indexOf(b.week_day);
    });
    setDefaultDays(sortedDays);
    setLoading(false);
  };

  const fetchAtypicalDaysList = async () => {
    const response = await getAtypicalDaysList();
    if (!response) {
      toast("Erro ao puxar a lista de dias atípicos.", {
        theme: "colored",
        type: "error",
      });
    }

    const responseFormatted = response.map((item: AtypicalDayObject) => {
      const [year, month, day] = item.exception_day.split("-");
      return { ...item, exception_day: `${day}/${month}/${year}` };
    });

    setAtypicalDaysList(responseFormatted);
  };

  const formatTimeValue = (value: string) => {
    const digits = value.replace(/\D/g, "");

    let formatted = "";

    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ":" + digits.substring(2, 4);
    }

    return formatted;
  };

  const formatDateValue = (value: string) => {
    const digits = value.replace(/\D/g, "");

    let formatted = "";

    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += "/" + digits.substring(2, 4);
    }
    if (digits.length >= 5) {
      formatted += "/" + digits.substring(4, 8);
    }

    return formatted;
  };

  const handleUpdateProperty = ({
    weekDay,
    key,
    value,
  }: {
    weekDay: string;
    key: string;
    value: unknown;
  }) => {
    setDefaultDays((previousDays) => {
      return previousDays.map((day) => {
        if (
          key === "open" ||
          key === "close" ||
          key === "break_start" ||
          key === "break_end"
        ) {
          return day.week_day === weekDay
            ? { ...day, [key]: formatTimeValue(String(value)) }
            : day;
        }
        return day.week_day === weekDay ? { ...day, [key]: value } : day;
      });
    });
  };

  const showToastMessage = ({
    success,
    successMessage,
    errorMessage,
  }: {
    success: boolean;
    successMessage: string;
    errorMessage: string;
  }) => {
    if (success) {
      toast(successMessage, {
        type: "success",
        theme: "colored",
      });
      return;
    }

    toast(errorMessage, {
      type: "error",
      theme: "colored",
    });
    return;
  };

  const handleSaveConfiguration = async () => {
    const formattedDays = defaultDays
      .map((day: ClinicDay): PutClinicAvailabilityType | undefined => {
        switch (day.week_day) {
          case "Segunda":
            return { ...day, week_day: "SEGUNDA", clinic_id: clinicId };
          case "Terça":
            return { ...day, week_day: "TERCA", clinic_id: clinicId };
          case "Quarta":
            return { ...day, week_day: "QUARTA", clinic_id: clinicId };
          case "Quinta":
            return { ...day, week_day: "QUINTA", clinic_id: clinicId };
          case "Sexta":
            return { ...day, week_day: "SEXTA", clinic_id: clinicId };
          case "Sábado":
            return { ...day, week_day: "SABADO", clinic_id: clinicId };
          case "Domingo":
            return { ...day, week_day: "DOMINGO", clinic_id: clinicId };
          default:
            return undefined;
        }
      })
      .filter((day): day is PutClinicAvailabilityType => day !== undefined);

    const response = await putClinicAvailability(formattedDays);
    showToastMessage({
      success: response === 200,
      successMessage: "Configurações atualizadas com sucesso",
      errorMessage:
        "Houve um erro ao atualizar as configurações, tente novamente mais tarde.",
    });

    await fetchClinicAvailability();
  };

  const handleOpenAtypicalDayModalConfig = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAtypicalDayConfig({
      clinic_id: clinicId,
      exception_day: "",
      is_working_day: false,
      open: "",
      close: "",
      break_start: "",
      break_end: "",
    });
  };

  const handleManageAtypicalDay = (
    objectKey: string,
    value: string | boolean
  ) => {
    setAtypicalDayConfig((prev) => {
      if (
        objectKey === "open" ||
        objectKey === "close" ||
        objectKey === "break_start" ||
        objectKey === "break_end"
      ) {
        const formattedValue = formatTimeValue(String(value));
        return { ...prev, [objectKey]: formattedValue };
      }

      if (objectKey === "exception_day") {
        const formattedValue = formatDateValue(String(value));
        return { ...prev, [objectKey]: formattedValue };
      }
      return { ...prev, [objectKey]: value };
    });
  };

  const saveAtypicalConfiguration = async () => {
    const [day, month, year] = atypicalDayConfig["exception_day"].split("/");
    const dateFormatted = `${year}-${month}-${day}`;
    const bodyFormatted = {
      ...atypicalDayConfig,
      exception_day: dateFormatted,
    };
    const response = await postAtypicalDayAvailability(bodyFormatted);
    if (response?.status === 201 || response?.status === 200) {
      handleCloseModal();
      await fetchAtypicalDaysList();
    }
    showToastMessage({
      success: response?.status === 200 || response?.status === 201,
      successMessage: "Dia atípico criado com sucesso",
      errorMessage:
        "Houve um erro ao criar o dia atípico, tente novamente mais tarde.",
    });
  };

  const handleChangeAtypicalDayCard = (
    id: number,
    objectKey: string,
    value: unknown
  ) => {
    setAtypicalDaysList((prevState) => {
      return prevState.map((day) => {
        if (day.id !== id) return day;
        if (objectKey === "exception_day") {
          return { ...day, exception_day: formatDateValue(String(value)) };
        }
        if (
          objectKey === "open" ||
          objectKey === "close" ||
          objectKey === "break_start" ||
          objectKey === "break_end"
        ) {
          return { ...day, [objectKey]: formatTimeValue(String(value)) };
        }
        return { ...day, [objectKey]: value };
      });
    });
  };

  const handleSaveNewAtypicalDayValue = async (id: number) => {
    const atypicalDayToUpdate = atypicalDaysList.filter(
      (atypicalDay) => atypicalDay.id === id
    );
    const [day, month, year] = atypicalDayToUpdate[0].exception_day.split("/");
    const newAtypicalDayToUpdate = {
      ...atypicalDayToUpdate[0],
      exception_day: `${year}-${month}-${day}`,
    };

    const response = await putUpdateAtypicalDay(newAtypicalDayToUpdate, id);

    showToastMessage({
      success: response?.status === 200 || response?.status === 201,
      successMessage: "Dia atualizado com sucesso",
      errorMessage:
        "Houve um erro ao atualizar o dia selecionado, tente novamente.",
    });

    await fetchAtypicalDaysList();
  };

  const handleDeleteAtypicalDay = async (id: number) => {
    const response = await deleteAtypicalDay(id);

    showToastMessage({
      success: response?.status === 204,
      successMessage: "Dia atípico deletado com sucesso",
      errorMessage:
        "Houve um erro ao deletar o dia atípico, tente novamente mais tarde",
    });

    await fetchAtypicalDaysList();
  };

  useEffect(() => {
    fetchClinicAvailability();
    fetchAtypicalDaysList();
  }, []);

  return (
    <div className={styles.container}>
      <ToastContainer />
      <div className={styles.header}>
        <h1>Configurações da clínica</h1>
        <p className={styles.subtitle}>
          {`Defina os dias de funcionamento e os horários (abertura, pausa e
          fechamento).`}
        </p>
      </div>
      {loading && (
        <div className={styles.containerWrapped}>
          <div className={styles.containerSkeleton}></div>
        </div>
      )}
      {!loading && defaultDays.length > 0 && (
        <div className={styles.containerWrapped}>
          {isModalOpen && (
            <BaseModalComponent handleCloseModal={handleCloseModal}>
              <AtypicalDayModalContent
                saveAtypicalConfiguration={saveAtypicalConfiguration}
                closeModal={handleCloseModal}
                atypicalConfigurationObject={atypicalDayConfig}
                handleChangeAtypicalConfigurationObject={
                  handleManageAtypicalDay
                }
              />
            </BaseModalComponent>
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
                <li key={day.week_day}>
                  <p>{day.week_day}</p>
                  <SwitchComponent
                    isOn={day.is_work_day}
                    handleToggle={() =>
                      handleUpdateProperty({
                        key: "is_work_day",
                        weekDay: day.week_day,
                        value: !day.is_work_day,
                      })
                    }
                  />
                  <div className={styles.inputContainer}>
                    <InputComponent
                      label=""
                      placeholder="00:00"
                      value={day.open ? String(day.open) : ""}
                      disabled={!day.is_work_day}
                      handleChangeInput={(event) =>
                        handleUpdateProperty({
                          key: "open",
                          weekDay: day.week_day,
                          value: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.inputContainer}>
                    <InputComponent
                      label=""
                      placeholder="00:00"
                      value={day.break_start ? String(day.break_start) : ""}
                      disabled={!day.is_work_day}
                      handleChangeInput={(event) =>
                        handleUpdateProperty({
                          key: "break_start",
                          weekDay: day.week_day,
                          value: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.inputContainer}>
                    <InputComponent
                      label=""
                      placeholder="00:00"
                      value={day.break_end ? String(day.break_end) : ""}
                      disabled={!day.is_work_day}
                      handleChangeInput={(event) =>
                        handleUpdateProperty({
                          key: "break_end",
                          weekDay: day.week_day,
                          value: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.inputContainer}>
                    <InputComponent
                      label=""
                      placeholder="00:00"
                      value={day.close ? String(day.close) : ""}
                      disabled={!day.is_work_day}
                      handleChangeInput={(event) =>
                        handleUpdateProperty({
                          key: "close",
                          weekDay: day.week_day,
                          value: event.target.value,
                        })
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.containerButton}>
            <div className={styles.atypicalDayButton}>
              <p onClick={handleOpenAtypicalDayModalConfig}>
                Adicionar dia atípico
              </p>
            </div>
            <div>
              <ButtonComponent
                text="Salvar"
                handleClickButton={handleSaveConfiguration}
              />
            </div>
          </div>
          <div className={styles.atypicalDaysList}>
            <h2>Lista de dias atípicos</h2>
            <ul className={styles.atypicalDaysUl}>
              {atypicalDaysList.length > 0 ? (
                <>
                  {atypicalDaysList.map((atypicalDay) => (
                    <li className={styles.atypicalDayCard} key={atypicalDay.id}>
                      <div className={styles.atypicalDayInput}>
                        <InputComponent
                          value={
                            atypicalDay.exception_day
                              ? String(atypicalDay.exception_day)
                              : ""
                          }
                          handleChangeInput={(e) =>
                            handleChangeAtypicalDayCard(
                              atypicalDay.id,
                              "exception_day",
                              e.target.value
                            )
                          }
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                      <SwitchComponent
                        handleToggle={() =>
                          handleChangeAtypicalDayCard(
                            atypicalDay.id,
                            "is_working_day",
                            !atypicalDay.is_working_day
                          )
                        }
                        isOn={atypicalDay.is_working_day}
                      />
                      <div className={styles.atypicalDayTime}>
                        <InputComponent
                          value={
                            atypicalDay.open ? String(atypicalDay.open) : ""
                          }
                          handleChangeInput={(e) =>
                            handleChangeAtypicalDayCard(
                              atypicalDay.id,
                              "open",
                              e.target.value
                            )
                          }
                          placeholder="00:00"
                        />
                      </div>
                      <div className={styles.atypicalDayTime}>
                        <InputComponent
                          value={
                            atypicalDay.break_start
                              ? String(atypicalDay.break_start)
                              : ""
                          }
                          handleChangeInput={(e) =>
                            handleChangeAtypicalDayCard(
                              atypicalDay.id,
                              "break_start",
                              e.target.value
                            )
                          }
                          placeholder="00:00"
                        />
                      </div>
                      <div className={styles.atypicalDayTime}>
                        <InputComponent
                          value={
                            atypicalDay.break_end
                              ? String(atypicalDay.break_end)
                              : ""
                          }
                          handleChangeInput={(e) =>
                            handleChangeAtypicalDayCard(
                              atypicalDay.id,
                              "break_end",
                              e.target.value
                            )
                          }
                          placeholder="00:00"
                        />
                      </div>
                      <div className={styles.atypicalDayTime}>
                        <InputComponent
                          value={
                            atypicalDay.close ? String(atypicalDay.close) : ""
                          }
                          handleChangeInput={(e) =>
                            handleChangeAtypicalDayCard(
                              atypicalDay.id,
                              "close",
                              e.target.value
                            )
                          }
                          placeholder="00:00"
                        />
                      </div>
                      <div className={styles.deleteAtypicalButtonContainer}>
                        <ButtonComponent
                          style={{ background: "var(--red-300)" }}
                          handleClickButton={() =>
                            handleDeleteAtypicalDay(atypicalDay.id)
                          }
                          text="Excluir"
                        />
                        <ButtonComponent
                          handleClickButton={() =>
                            handleSaveNewAtypicalDayValue(atypicalDay.id)
                          }
                          text="Salvar"
                        />
                      </div>
                    </li>
                  ))}
                </>
              ) : (
                <div className={styles.emptyContentContainer}>
                  <p>Não existem dias atípicos configurados.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
