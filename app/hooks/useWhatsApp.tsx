"use client";

import { useEffect, useState } from "react";
import { getWhatsAppStatus } from "@/app/actions/getWhatsAppStatus";
import { getQrCode } from "@/app/actions/getQrCode";

type WhatsAppStatus = {
  status: "CONNECTED" | "DISCONNECTED" | string;
  connectedPhoneNumber: string | null;
};

export function useWhatsApp(clinicId?: number | null) {
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(
    null
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    if (!clinicId) return;
    try {
      const res = await getWhatsAppStatus({ clinicId });
      setWhatsAppStatus({
        status: res.status,
        connectedPhoneNumber: res.connected_phone_number,
      });
    } catch {
      setError(true);
    }
  };

  const fetchQrCode = async () => {
    if (!clinicId) return;
    try {
      const res = await getQrCode({ clinicId });
      if (res) setQrCode(`data:image/png;base64,${res}`);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      await fetchStatus();
    })();
  }, [clinicId]);

  useEffect(() => {
    if (whatsAppStatus?.status === "CONNECTED") {
      setQrCode(null);
      setLoading(false);
      return;
    }
    if (whatsAppStatus && whatsAppStatus.status !== "CONNECTED") {
      fetchQrCode();
    }
  }, [whatsAppStatus]);

  return { whatsAppStatus, qrCode, loading, error, refresh: fetchStatus };
}
