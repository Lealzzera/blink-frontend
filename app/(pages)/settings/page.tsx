"use client";

import { useEffect, useState } from "react";
import { getQrCode } from "@/app/actions/getQrCode";
import { useUser } from "@/app/context/userContext";
import Image from "next/image";
import style from "./style.module.css";
import { LogOut, MessageCircleOff } from "lucide-react";
import { logout } from "@/app/actions/logout";

export default function Settings() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const { clinicId } = useUser();

  const handleLogout = async () => {
    await logout();
  };

  const handleGetQrCode = async () => {
    setError(false);
    setIsLoading(true);
    const response = await getQrCode({ clinicId });
    if (!response) {
      setIsLoading(false);
      setError(true);
      return;
    }
    const imageUrl = `data:image/png;base64,${response}`;

    setQrCodeUrl(imageUrl);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!clinicId) return;
    handleGetQrCode();
  }, [clinicId]);

  return (
    <div className={style.containerSettings}>
      <div className={style.containerSettingsText}>
        <h1>Configurações</h1>
        <p>
          Abra seu aplicativo do WhatsApp e escaneie o código QR abaixo para
          conectar a sua conta:
        </p>
      </div>
      {qrCodeUrl && !isLoading && !error && (
        <div className={style.containerQrCode}>
          <Image
            src={qrCodeUrl}
            alt="QR code"
            style={{ maxWidth: 320 }}
            width={320}
            height={320}
          />
        </div>
      )}
      {!qrCodeUrl && isLoading && !error && (
        <div className={style.containerSkeletonQrCode}></div>
      )}

      {error && (
        <div className={style.containerErrorQrCode}>
          <p>Erro ao carregar o código QR.</p>
          <p
            onClick={handleGetQrCode}
            style={{ color: "#3279a8", cursor: "pointer", fontWeight: 600 }}
          >
            Tentar novamente
          </p>
        </div>
      )}
      <ul className={style.optionsList}>
        <li>
          <div className={style.disconnectOption}>
            <span>
              <MessageCircleOff />
            </span>
            <p>Desconectar WhatsApp</p>
          </div>
        </li>
        <li>
          <div onClick={handleLogout} className={style.logoutOption}>
            <span>
              <LogOut className={style.logoutIcon} />
            </span>
            <p>Sair</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
