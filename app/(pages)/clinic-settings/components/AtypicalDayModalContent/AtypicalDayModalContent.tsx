import InputComponent from "@/app/components/InputComponent/InputComponent";
import SwitchComponent from "@/app/components/SwitchComponent/SwitchComponent";
import styles from "./style.module.css";
import ButtonComponent from "@/app/components/ButtonComponent/ButtonComponent";
import { AtypicalConfigurationObject } from "@/app/types/types";

type AtypicalDayModalContentProps = {
  closeModal: () => void;
  saveAtypicalConfiguration: () => void;
  atypicalConfigurationObject: AtypicalConfigurationObject;
  handleChangeAtypicalConfigurationObject: (
    objectKey: string,
    value: string | boolean
  ) => void;
};

export default function AtypicalDayModalContent({
  closeModal,
  saveAtypicalConfiguration,
  atypicalConfigurationObject,
  handleChangeAtypicalConfigurationObject,
}: AtypicalDayModalContentProps) {
  return (
    <div className={styles.modalContainer}>
      <h2>Configure aqui um dia atípico de funcionamento</h2>
      <div className={styles.containerSwitchInput}>
        <div className={styles.inputContainer}>
          <InputComponent
            placeholder="DD/MM/AAAA"
            label="Digite o dia atípico"
            handleChangeInput={(e) =>
              handleChangeAtypicalConfigurationObject(
                "exception_day",
                e.target.value
              )
            }
            value={atypicalConfigurationObject["exception_day"]}
          />
        </div>
        <div className={styles.switchContainer}>
          <p>Nesse dia a clínica vai funcionar?</p>
          <SwitchComponent
            handleToggle={() =>
              handleChangeAtypicalConfigurationObject(
                "is_working_day",
                !atypicalConfigurationObject["is_working_day"]
              )
            }
            isOn={atypicalConfigurationObject["is_working_day"]}
          />
        </div>
      </div>
      {atypicalConfigurationObject["is_working_day"] && (
        <div className={styles.workTimeContainer}>
          <p>Configure os horários de funcionamento</p>
          <div className={styles.workTimeInputs}>
            <div className={styles.inputContainer}>
              <InputComponent
                placeholder="00:00"
                label="Início"
                handleChangeInput={(e) =>
                  handleChangeAtypicalConfigurationObject(
                    "open",
                    e.target.value
                  )
                }
                value={atypicalConfigurationObject["open"]}
              />
            </div>
            <div className={styles.inputContainer}>
              <InputComponent
                placeholder="00:00"
                label="Pausa"
                handleChangeInput={(e) =>
                  handleChangeAtypicalConfigurationObject(
                    "break_start",
                    e.target.value
                  )
                }
                value={atypicalConfigurationObject["break_start"]}
              />
            </div>
            <div className={styles.inputContainer}>
              <InputComponent
                placeholder="00:00"
                label="Retorno"
                handleChangeInput={(e) =>
                  handleChangeAtypicalConfigurationObject(
                    "break_end",
                    e.target.value
                  )
                }
                value={atypicalConfigurationObject["break_end"]}
              />
            </div>
            <div className={styles.inputContainer}>
              <InputComponent
                placeholder="00:00"
                label="Fechamento"
                handleChangeInput={(e) =>
                  handleChangeAtypicalConfigurationObject(
                    "close",
                    e.target.value
                  )
                }
                value={atypicalConfigurationObject["close"]}
              />
            </div>
          </div>
        </div>
      )}
      <div className={styles.containerButtons}>
        <p onClick={closeModal}>Cancelar</p>
        <div className={styles.containerSaveButton}>
          <ButtonComponent
            text="Salvar"
            handleClickButton={saveAtypicalConfiguration}
          />
        </div>
      </div>
    </div>
  );
}
