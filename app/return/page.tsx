'use client';

import CircularProgress from '@mui/material/CircularProgress';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { completeStripeCheckoutSession } from '../actions/completeStripeCheckoutSession';

function ReturnPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let shouldCancel = false;

    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkoutSessionId = sessionId;

    async function completeCheckoutSession() {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const result = await completeStripeCheckoutSession(checkoutSessionId);

        if (shouldCancel) return;

        if (!result.error) {
          setStatus('success');
          setTimeout(() => {
            router.replace('/settings');
          }, 3500);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (!shouldCancel) {
        setStatus('error');
      }
    }

    completeCheckoutSession();

    return () => {
      shouldCancel = true;
    };
  }, [router, sessionId]);

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '24px',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress size={64} color="primary" />
          <h2>Processando seu cadastro...</h2>
          <p style={{ color: '#666' }}>Aguarde um momento.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <span style={{ fontSize: '64px' }}>OK</span>
          <h2>Cadastro realizado com sucesso!</h2>
          <p style={{ color: '#666' }}>
            Sua conta foi criada. Voce sera redirecionado para configurar o WhatsApp.
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <span style={{ fontSize: '64px' }}>!</span>
          <h2>Algo deu errado</h2>
          <p style={{ color: '#666' }}>
            Nao conseguimos confirmar seu pagamento. Entre em contato com o suporte.
          </p>
        </>
      )}
    </main>
  );
}

export default function ReturnPage() {
  return (
    <Suspense>
      <ReturnPageContent />
    </Suspense>
  );
}
