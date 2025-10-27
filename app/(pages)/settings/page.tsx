"use client";

import { useEffect, useState } from "react";
import { getQrCode } from "@/app/actions/getQrCode";
import { useUser } from "@/app/context/userContext";
import Image from "next/image";

export default function Settings() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { clinicId } = useUser();

  useEffect(() => {
    if (!clinicId) return;
    const handleGetQrCode = async () => {
      setIsLoading(true);
      const response = await getQrCode({ clinicId });
      const imageUrl = `data:image/png;base64,${response}`;
      setQrCodeUrl(imageUrl);
      setIsLoading(false);
    };
    handleGetQrCode();
  }, [clinicId]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Configurações</h1>

      {qrCodeUrl && !isLoading && (
        <div style={{ marginTop: 16 }}>
          <Image
            src={qrCodeUrl}
            alt="QR code"
            style={{ maxWidth: 320 }}
            width={320}
            height={320}
          />
        </div>
      )}
    </div>
  );
}
