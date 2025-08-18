import React from 'react';
import styles from '../../app/config/config.module.css';

interface WhatsAppStatusProps {
  status?: string;
  phoneNumber?: string;
  onShowQrCode: () => void;
  showQrCode: boolean;
  qrCodeUrl: string | null;
  qrCodeError: string | null;
}

export const WhatsAppStatus: React.FC<WhatsAppStatusProps> = ({
  status,
  phoneNumber,
  onShowQrCode,
  showQrCode,
  qrCodeUrl,
  qrCodeError
}) => {
  return (
    <>
      <div className={styles.item}>
        <h3>Número conectado</h3>
        <p className={styles.number}>
          {status === 'DISCONNECTED' ? (
            <>
              Desconectado <span className={styles.disconnected}></span>
            </>
          ) : (
            phoneNumber
          )}
        </p>
      </div>

      <button className={styles.buttonWpp} onClick={onShowQrCode}>
        QR Code WhatsApp
      </button>
      
      {showQrCode && (
        <div className={styles.qrCodeContainer}>
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code WhatsApp"
              className={styles.qrCodeImage}
            />
          ) : qrCodeError ? (
            <p className={styles.errorMessage}>{qrCodeError}</p>
          ) : (
            <p>Carregando QR Code...</p>
          )}
        </div>
      )}
    </>
  );
};