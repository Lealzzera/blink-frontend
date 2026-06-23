'use client';

import { changePassword } from '@/app/actions/changePassword';
import { deleteWhatsappConnection } from '@/app/actions/deleteWhatsappConnection';
import { logout } from '@/app/actions/logout';
import BaseModalComponent from '@/app/components/BaseModalComponent/BaseModalComponent';
import ButtonComponent from '@/app/components/ButtonComponent/ButtonComponent';
import InputComponent from '@/app/components/InputComponent/InputComponent';
import { useUser } from '@/app/context/userContext';
import { useWhatsApp } from '@/app/hooks/useWhatsApp';
import { Headset, LockKeyhole, LogOut, MessageCircleOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import style from './style.module.css';

export default function Settings() {
  const router = useRouter();
  const { clinicInfo, handleSetContactSelected } = useUser();
  const { whatsAppStatus, qrCode, loading, error, refresh } = useWhatsApp();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const showQrCode = () => {
    return qrCode && !loading && !error;
  };

  const showLoadingSkeleton = () => {
    return !qrCode && loading && !error;
  };

  const showWhatsAppStatus = () => {
    return whatsAppStatus?.connected && !loading;
  };

  const handleDisconnectWhatsapp = async () => {
    const response = await deleteWhatsappConnection('default');
    if (response?.status === 'STOPPED' || response?.status === 'DISCONNECTED') {
      handleSetContactSelected(null);
      toast('WhatsApp desconectado com sucesso.', {
        type: 'success',
        theme: 'colored',
      });
      return;
    }

    toast('Falha ao desconectar whatsapp.', {
      type: 'error',
      theme: 'colored',
    });
    return;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleOpenSupport = () => {
    const message = encodeURIComponent(
      'Ola, sou usuario do sistema de agendamento da Blink e gostaria de ajuda.',
    );

    window.open(`https://wa.me/5511982006666?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const closeChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast('A nova senha precisa ter pelo menos 8 caracteres.', {
        type: 'error',
        theme: 'colored',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast('As novas senhas nao conferem.', {
        type: 'error',
        theme: 'colored',
      });
      return;
    }

    setIsSubmittingPassword(true);

    const response = await changePassword({
      currentPassword,
      newPassword,
    });

    setIsSubmittingPassword(false);

    if (response.error) {
      toast(response.error, {
        type: 'error',
        theme: 'colored',
      });
      return;
    }

    toast('Senha redefinida com sucesso.', {
      type: 'success',
      theme: 'colored',
    });
    closeChangePasswordModal();
  };

  return (
    <div className={style.containerSettings}>
      <ToastContainer />
      <div className={style.containerSettingsText}>
        <h1>Configurações</h1>
        <p>Abra o WhatsApp e escaneie o código QR abaixo para conectar sua conta:</p>
      </div>

      {showQrCode() && (
        <div className={style.containerQrCode}>
          <Image src={qrCode!} alt="QR code" width={320} height={320} unoptimized />
        </div>
      )}

      {showLoadingSkeleton() && <div className={style.containerSkeletonQrCode} />}

      {showWhatsAppStatus() && (
        <div className={style.containerConnected}>
          <p>WhatsApp status: Conectado</p>
          <p>Número conectado: {whatsAppStatus?.me.id}</p>
          <p>Nome: {whatsAppStatus?.me.pushName}</p>
        </div>
      )}

      {error && (
        <div className={style.containerErrorQrCode}>
          <p>Erro ao carregar o código QR.</p>
          <p onClick={refresh} style={{ color: '#3279a8', cursor: 'pointer', fontWeight: 600 }}>
            Tentar novamente
          </p>
        </div>
      )}

      <ul className={style.optionsList}>
        <li>
          <div onClick={handleDisconnectWhatsapp} className={style.disconnectOption}>
            <MessageCircleOff />
            <p>Desconectar WhatsApp</p>
          </div>
        </li>
        <li>
          <div
            onClick={() => setIsChangePasswordModalOpen(true)}
            className={style.changePasswordOption}
          >
            <LockKeyhole />
            <p>Redefinir senha</p>
          </div>
        </li>
        <li>
          <div onClick={handleOpenSupport} className={style.supportOption}>
            <Headset />
            <p>Suporte / Cancelar conta</p>
          </div>
        </li>
        <li>
          <div onClick={handleLogout} className={style.logoutOption}>
            <LogOut className={style.logoutIcon} />
            <p>Sair</p>
          </div>
        </li>
      </ul>

      {isChangePasswordModalOpen && (
        <BaseModalComponent handleCloseModal={closeChangePasswordModal}>
          <form className={style.changePasswordModal} onSubmit={handleChangePassword}>
            <div className={style.changePasswordHeader}>
              <LockKeyhole />
              <div>
                <h2>Redefinir senha</h2>
                <p>Informe sua senha atual e escolha uma nova senha de acesso.</p>
              </div>
            </div>

            <div className={style.changePasswordFields}>
              <InputComponent
                label="Senha atual"
                type="password"
                value={currentPassword}
                handleChangeInput={(event) => setCurrentPassword(event.target.value)}
                required
              />
              <InputComponent
                label="Nova senha"
                type="password"
                value={newPassword}
                handleChangeInput={(event) => setNewPassword(event.target.value)}
                required
              />
              <InputComponent
                label="Confirmar nova senha"
                type="password"
                value={confirmNewPassword}
                handleChangeInput={(event) => setConfirmNewPassword(event.target.value)}
                required
              />
            </div>

            <div className={style.changePasswordActions}>
              <button type="button" onClick={closeChangePasswordModal}>
                Cancelar
              </button>
              <ButtonComponent
                type="submit"
                text={isSubmittingPassword ? 'Salvando...' : 'Salvar senha'}
                disabled={
                  isSubmittingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmNewPassword
                }
              />
            </div>
          </form>
        </BaseModalComponent>
      )}
    </div>
  );
}
