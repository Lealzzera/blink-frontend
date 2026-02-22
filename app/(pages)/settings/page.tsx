"use client";

import { useWhatsApp } from "@/app/hooks/useWhatsApp";
import { useUser } from "@/app/context/userContext";
import Image from "next/image";
import style from "./style.module.css";
import { LogOut, MessageCircleOff } from "lucide-react";
import { logout } from "@/app/actions/logout";
import { deleteWhatsappConnection } from "@/app/actions/deleteWhatsappConnection";
import { toast, ToastContainer } from "react-toastify";

export default function Settings() {
  const { clinicId } = useUser();
  const { whatsAppStatus, qrCode, loading, error, refresh } =
    useWhatsApp(clinicId);

  const showQrCode = () => {
    return (
      qrCode && !loading && !error && whatsAppStatus?.status !== "CONNECTED"
    );
  };

  const showLoadingSkeleton = () => {
    return !qrCode && loading && !error;
  };

  const showWhatsAppStatus = () => {
    return whatsAppStatus?.status === "CONNECTED" && !loading;
  };

  const handleDisconnectWhatsapp = async () => {
    const response = await deleteWhatsappConnection();
    if (response.status === "DISCONNECTED") {
      toast("WhatsApp desconectado com sucesso.", {
        type: "success",
        theme: "colored",
      });
      return;
    }

    toast("Falha ao desconectar whatsapp.", {
      type: "error",
      theme: "colored",
    });
    return;
  };

  const handleLogout = async () => await logout();

  return (
    <div className={style.containerSettings}>
      <ToastContainer />
      <div className={style.containerSettingsText}>
        <h1>Configurações</h1>
        <p>
          Abra o WhatsApp e escaneie o código QR abaixo para conectar sua conta:
        </p>
      </div>

      {showQrCode() && (
        <div className={style.containerQrCode}>
          <Image src={qrCode!} alt="QR code" width={320} height={320} />
        </div>
      )}

      {showLoadingSkeleton() && (
        <div className={style.containerSkeletonQrCode} />
      )}

      {showWhatsAppStatus() && (
        <div className={style.containerConnected}>
          <p>WhatsApp status: Conectado</p>
          <p>Número conectado: {whatsAppStatus?.connectedPhoneNumber}</p>
        </div>
      )}

      {error && (
        <div className={style.containerErrorQrCode}>
          <p>Erro ao carregar o código QR.</p>
          <p
            onClick={refresh}
            style={{ color: "#3279a8", cursor: "pointer", fontWeight: 600 }}
          >
            Tentar novamente
          </p>
        </div>
      )}

      <ul className={style.optionsList}>
        <li>
          <div
            onClick={handleDisconnectWhatsapp}
            className={style.disconnectOption}
          >
            <MessageCircleOff />
            <p>Desconectar WhatsApp</p>
          </div>
        </li>
        <li>
          <div onClick={handleLogout} className={style.logoutOption}>
            <LogOut className={style.logoutIcon} />
            <p>Sair</p>
          </div>
        </li>
      </ul>
    </div>
  );
}
