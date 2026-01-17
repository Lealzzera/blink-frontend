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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    if (!clinicId) return;
    try {
      const res = await getWhatsAppStatus();
      setWhatsAppStatus({
        status: res.status,
        connectedPhoneNumber: res.connected_number,
      });
    } catch {
      setError(true);
    }
  };

  const fetchQrCode = async () => {
    setLoading(true);
    try {
      const res = await getQrCode();
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
    setLoading(true);
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
