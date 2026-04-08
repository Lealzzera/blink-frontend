'use client'

import InputComponent from '@/app/components/InputComponent/InputComponent';
import styles from './styles.module.css';
import { RegisterClinicObject } from '../../page';

type RegisterUserInfoComponentProps = {
    nameValue: string;
    setNameValue: (value: string) => void;
    lastNameValue: string;
    setLastNameValue: (value: string) => void;
    emailValue: string;
    setEmailValue: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    confirmPassword: string;
    setConfirmPassword: (value: string) => void;
}

export default function RegisterUserInfoComponent({ password, setPassword, confirmPassword, setConfirmPassword, nameValue, setNameValue, lastNameValue, setLastNameValue, emailValue, setEmailValue }: RegisterUserInfoComponentProps) {
    return (
        <section className={styles.userInfoSection}>
            <h2>Informações do usuário</h2>
            <p>Vamos lá, para realizar o cadastro preencha as suas informações de acesso.</p>
            <div className={styles.userInfoSection}>
            <div className={styles.nameContainer}>
                <InputComponent 
                    type="text"
                    label="Nome"
                    required
                    value={nameValue}
                    handleChangeInput={(e) => setNameValue(e.target.value)}
                />
                <InputComponent 
                    type="text"
                    label="Sobrenome"
                    required
                    value={lastNameValue}
                    handleChangeInput={(e) => setLastNameValue(e.target.value)}
                />
            </div>
            <div className={styles.emailContainer}>
                <InputComponent 
                    type="email"
                    label="E-mail"
                    required
                    value={emailValue}
                    handleChangeInput={(e) => setEmailValue(e.target.value)}
                />
            </div>
            <div className={styles.passwordContainer}>
                <InputComponent 
                    type="password"
                    label="Senha (mínimo 8 caracteres)"
                    value={password}
                    required
                    handleChangeInput={(e) => setPassword(e.target.value)}
                />
                <InputComponent
                    required
                    type="password"
                    label="Confirmar senha"
                    value={confirmPassword}
                    handleChangeInput={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
            </div>
        </section>
    )
}
