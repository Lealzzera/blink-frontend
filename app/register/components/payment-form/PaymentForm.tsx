'use client';

import { postSignupDraft } from '@/app/actions/postSignupDraft';
import { postStripeCheckoutSession } from '@/app/actions/postStripeCheckoutSession';
import { ServiceType, SignupDraftData, WorkingHour } from '@/app/types/types';
import CircularProgress from '@mui/material/CircularProgress';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

type PaymentFormProps = {
  stripePriceId: string;
  clinicData: {
    userFullName: string;
    userEmail: string;
    password: string;
    clinicName: string;
    clinicType: string;
    address: string;
    postalCode: string;
    city: string;
    state: string;
    planId: string;
    workingHours: WorkingHour[];
    services: ServiceType[];
    settings: {
      chargesEvaluation: boolean;
      evaluationPriceCents: number;
    };
  };
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export function PaymentForm({ stripePriceId, clinicData }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    // Previne dupla execução no StrictMode do React (que desmonta/remonta em dev)
    if (didInit.current) return;
    didInit.current = true;

    async function initCheckout() {
      // 1. Salva o draft no backend — retorna o draftId
      const [firstName, ...rest] = clinicData.userFullName.split(' ');
      const draftData: SignupDraftData = {
        clinicName: clinicData.clinicName,
        clinicType: clinicData.clinicType as SignupDraftData['clinicType'],
        phone: '',
        address: clinicData.address,
        postalCode: clinicData.postalCode,
        city: clinicData.city,
        state: clinicData.state,
        planId: clinicData.planId,
        workingHours: clinicData.workingHours as SignupDraftData['workingHours'],
        services: clinicData.services,
        settings: clinicData.settings,
      };

      const draft = await postSignupDraft({
        fullName: clinicData.userFullName,
        email: clinicData.userEmail,
        password: clinicData.password,
        selectedPlanId: clinicData.planId,
        data: draftData,
      });

      if (!draft?.draftId) {
        setIsLoading(false);
        setError(true);
        return;
      }

      // 2. Cria a sessão do Stripe com o draftId vinculado
      const session = await postStripeCheckoutSession({
        stripePriceId,
        draftId: draft.draftId,
      });

      if (!session?.clientSecret) {
        setIsLoading(false);
        setError(true);
        return;
      }

      setClientSecret(session.clientSecret);
      setIsLoading(false);
    }

    initCheckout();
  }, []);

  return (
    <div className={styles.checkoutSession}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <CircularProgress size={100} color="primary" aria-label="Loading…" />
        </div>
      ) : error ? (
        <div className={styles.loadingContainer}>
          <h3>Erro ao carregar o pagamento. Tente novamente.</h3>
        </div>
      ) : (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout className={styles.checkout} />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}
