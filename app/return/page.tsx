'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

// O Stripe redireciona para /return?session_id=cs_xxx após o pagamento.
// Neste ponto o webhook já foi (ou será em instantes) disparado para criar
// a clínica e o usuário. Mostramos uma tela de confirmação e redirecionamos.

export default function ReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Pequeno delay para dar tempo ao webhook processar antes de redirecionar
    const timer = setTimeout(() => {
      setStatus('success');
    }, 3000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  useEffect(() => {
    if (status === 'success') {
      const redirect = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(redirect);
    }
  }, [status, router]);

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
          <span style={{ fontSize: '64px' }}>🎉</span>
          <h2>Cadastro realizado com sucesso!</h2>
          <p style={{ color: '#666' }}>
            Sua conta foi criada. Você será redirecionado para o login em instantes.
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <span style={{ fontSize: '64px' }}>⚠️</span>
          <h2>Algo deu errado</h2>
          <p style={{ color: '#666' }}>
            Não conseguimos confirmar seu pagamento. Entre em contato com o suporte.
          </p>
        </>
      )}
    </main>
  );
}
