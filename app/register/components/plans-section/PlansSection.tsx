import { Plan } from '../../../types/types';
import styles from './styles.module.css';

type PlanSectionProps = {
  plansList: Plan[];
  setSelectedPlan: (planId: string) => void;
  selectedPlan: string;
};

export function PlansSection({ plansList, setSelectedPlan, selectedPlan }: PlanSectionProps) {
  return (
    <section className={styles.planSection}>
      <div className={styles.planSectionHeader}>
        <h2>Planos</h2>
        <p>Escolha o plano que melhor se adapta às necessidades da sua clínica</p>
      </div>
      <div className={styles.planContainer}>
        <ul className={styles.planListUl}>
          {plansList.map((plan) => {
            const [value, cents] = (plan.priceMonthly / 100).toFixed(2).split('.');
            return (
              <li key={plan.id}>
                <div
                  className={`${plan.code === 'plus' ? styles.plusCard : styles.basicCard} ${selectedPlan === plan.id ? styles.planSelected : ''}`}
                >
                  {plan.code === 'plus' && <span className={styles.popularTag}>Mais Popular</span>}
                  <span className={styles.planBadge}>{plan.code}</span>
                  <h3>{plan.name}</h3>
                  <p className={styles.tagline}>{plan.description}</p>
                  <div className={styles.divider} />
                  <div className={styles.priceBlock}>
                    <span className={styles.priceCurrency}>R$</span>
                    <span className={styles.priceValue}>{value}</span>
                    <span className={styles.pricePeriod}>,{cents}&nbsp;/&nbsp;mês</span>
                  </div>
                  <span className={styles.trialBadge}>{plan.trialDays} dias grátis</span>
                  <div className={styles.divider} />
                  <ul className={styles.featureList}>
                    <li className={styles.featureItem}>
                      <span className={styles.featureIcon}>✦</span>
                      <span className={styles.featureLabel}>Agendamentos mensais</span>
                      <span className={styles.featureValue}>
                        {plan.maxMonthlyAppointments ? plan.maxMonthlyAppointments : 'Ilimitados'}
                      </span>
                    </li>
                    <li className={styles.featureItem}>
                      <span className={styles.featureIcon}>✦</span>
                      <span className={styles.featureLabel}>Usuários</span>
                      <span className={styles.featureValue}>{plan.maxUsers}</span>
                    </li>
                    <li className={styles.featureItem}>
                      <span className={styles.featureIcon}>✦</span>
                      <span className={styles.featureLabel}>Sessões ativas</span>
                      <span className={styles.featureValue}>{plan.maxWhatsappSessions}</span>
                    </li>
                  </ul>
                  <div className={styles.ctaButton}>
                    <button onClick={() => setSelectedPlan(plan.id)} type="button">
                      Começar agora
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
