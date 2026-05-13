'use client';

import { getQrCode } from '@/app/actions/getQrCode';
import { useEffect, useState } from 'react';

type WhatsAppStatus = {
  connected: boolean;
  status: string | null;
  me: {
    id: string;
    pushName: string;
  };
};

export function useWhatsApp() {
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchQrCode = async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await getQrCode();

      if (!response) {
        setError(true);
        return;
      }

      setWhatsAppStatus({
        connected: response.status === 'WORKING',
        status: response.status,
        me: response.me,
      });

      setQrCode(response.qrCode);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCode();
  }, []);

  return { whatsAppStatus, qrCode, loading, error, refresh: fetchQrCode };
}
