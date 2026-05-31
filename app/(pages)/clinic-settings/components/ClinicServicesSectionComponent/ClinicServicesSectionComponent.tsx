'use client';

import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import RegisterClinicServices, {
  ServiceType,
} from '@/app/register/components/register-clinic-services/RegisterClinicServices';
import styles from '../../style.module.css';

type ClinicServicesSectionComponentProps = {
  services: ServiceType[];
  setServices: (value: ServiceType[]) => void;
  handleSaveServices: () => void;
};

export default function ClinicServicesSectionComponent({
  services,
  setServices,
  handleSaveServices,
}: ClinicServicesSectionComponentProps) {
  const hasInvalidService = services.some((service) => !service.name.trim());

  return (
    <div className={styles.servicesCard}>
      <RegisterClinicServices
        services={services}
        setServices={setServices}
        chargesEvaluation={false}
        setChargesEvaluation={() => null}
        evaluationPrice={0}
        setEvaluationPrice={() => null}
        textAreaValue=""
        setTextAreaValue={() => null}
        showEvaluationSection={false}
        showAdditionalInformation={false}
      />

      <div className={styles.servicesActions}>
        <ButtonComponent
          text="Salvar serviços"
          disabled={hasInvalidService}
          handleClickButton={handleSaveServices}
        />
      </div>
    </div>
  );
}
