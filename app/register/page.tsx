"use client";

import { useEffect, useState } from "react";
import RegisterUserInfoComponent from "./components/register-user-info/RegisterUserInfoComponent";
import styles from "./styles.module.css";
import ButtonComponent from "../components/ButtonComponent/ButtonComponent";
import RegisterClinicInfo from "./components/register-clinic-info/RegisterClinicInfo";

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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [registerObject, setRegisterObject] = useState<RegisterClinicObject>({
    userFullName: "",
    userEmail: "",
    password: "",
    clinicName: "",
    clinicType: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    planId: "",
    workingHours: [],
    services: [],
    settings: {
      chargesEvaluation: false,
      evaluationPriceCents: 0,
      maxAppointmentsPerSlot: 0,
      appointmentDurationMinutes: 0,
      allowRescheduling: false,
      allowCancelation: false,
      aiAgentName: "",
    },
  });

  const disableFirstStep =
    password !== confirmPassword ||
    password.length < 8 ||
    !name ||
    !lastName ||
    !registerObject.userEmail;
  const clinicTypeOptions = [
    { value: "DENTAL", label: "Clínica Odontológica" },
    { value: "MEDICAL", label: "Clínica Médica" },
    { value: "AESTHETIC", label: "Clínica Estética" },
    { value: "PSYCHOLOGY", label: "Clínica de Psicologia" },
    { value: "OTHER", label: "Outro" },
  ];
  const handleChangeObjectValue = <K extends keyof RegisterClinicObject>(
    key: K,
    value: RegisterClinicObject[K],
  ) => {
    setRegisterObject((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  useEffect(() => {
    console.log({ registerObject });
  }, [registerObject]);

  return (
    <section className={styles.registerSection}>
      <h1>Cadastro</h1>
      <p>Siga os passos abaixo para criar a sua conta</p>
      <div className={styles.registerContainer}>
        {currentStep === 2 && (
          <RegisterUserInfoComponent
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            setEmailValue={(value) =>
              handleChangeObjectValue("userEmail", value)
            }
            emailValue={registerObject.userEmail}
            nameValue={name}
            setNameValue={setName}
            lastNameValue={lastName}
            setLastNameValue={setLastName}
          />
        )}
        {currentStep === 1 && (
          <RegisterClinicInfo
            clinicPostalCode={registerObject.postalCode}
            setClinicPostalCode={(value) =>
              handleChangeObjectValue("postalCode", value)
            }
            clinicTypeValue={registerObject.clinicType}
            setClinicTypeValue={(value) =>
              handleChangeObjectValue("clinicType", value)
            }
            clinicTypeOptions={clinicTypeOptions}
            clinicNameValue={registerObject.clinicName}
            setClinicNameValue={(value) =>
              handleChangeObjectValue("clinicName", value)
            }
            clinicPhoneNumber={registerObject.phone}
            setClinicPhoneNumber={(value) =>
              handleChangeObjectValue("phone", value)
            }
            clinicAddress={registerObject.address}
            setClinicAddress={(value) =>
              handleChangeObjectValue("address", value)
            }
            clinicCity={registerObject.city}
            setClinicCity={(value) => handleChangeObjectValue("city", value)}
            clinicState={registerObject.state}
            setClinicState={(value) => handleChangeObjectValue("state", value)}
          />
        )}
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
        >
          <div style={{ width: "100px" }}>
            <ButtonComponent
              disabled={currentStep === 1}
              style={{ width: "100px" }}
              text="Voltar"
              handleClickButton={() => setCurrentStep(1)}
            />
          </div>
          <div style={{ width: "100px" }}>
            <ButtonComponent
              disabled={disableFirstStep}
              style={{ width: "100px" }}
              text="Próximo"
              handleClickButton={handleNextStep}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
