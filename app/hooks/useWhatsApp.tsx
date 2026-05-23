'use client';

import { useEffect, useState } from 'react';
import { getQrCode } from '../actions/getQrCode';
import { useUser } from '../context/userContext';

type WhatsAppStatus = {
  connected: boolean;
  status: string | null;
  me: {
    id: string;
    pushName: string;
  };
};

export function useWhatsApp() {
  const { clinicInfo } = useUser();
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchQrCode = async () => {
    setLoading(true);
    setError(false);
    if (!clinicInfo?.clinicId) {
      return;
    }

    try {
      //TODO: AFTER WAHA PAYMENT IMPLEMENT THIS LOGIC BELOW
      // const response = await getQrCode(clinicInfo.clinicId);
      const response = await getQrCode('default', clinicInfo.clinicId);
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
  }, [clinicInfo]);

  return { whatsAppStatus, qrCode, loading, error, refresh: fetchQrCode };
}
