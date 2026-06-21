"use client";
import { useState } from "react";
import Image from "next/image";
import InputComponent from "../InputComponent/InputComponent";
import styles from "./styles.module.css";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { login } from "@/app/actions/login";
import { useRouter } from "next/navigation";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    const response = await login({ email, password });
    setIsLoading(false);
    if (response.error) {
      setError(true);
      return;
    }

    router.push("/conversations");
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  const handleRedirectToRegisterPage = () => {
    router.push("/register");
  };

  return (
    <section className={styles.loginSection}>
      <div className={styles.loginContainer}>
        <div className={styles.logoContainer}>
          <Image
            src="/images/apenas-img-blink.png"
            alt="Logo da Blink"
            width={60}
            height={60}
          />
        </div>
        <div>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <InputComponent
              error={error}
              required={true}
              disabled={isLoading}
              type="email"
              placeholder="Digite seu email"
              label="Email"
              value={email}
              handleChangeInput={(e) => setEmail(e.target.value)}
            />
            <InputComponent
              error={error}
              disabled={isLoading}
              required={true}
              type="password"
              placeholder="Digite sua senha"
              label="Senha"
              value={password}
              handleChangeInput={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className={styles.errorMessage}>Email ou senha incorretos</p>
            )}
            <div className={styles.buttonContainer}>
              <ButtonComponent
                disabled={email === "" || password === "" || isLoading}
                text="Login"
              />
            </div>
          </form>
          <div className={styles.forgotPassword}>
            <p onClick={handleForgotPassword}>Esqueci minha senha</p>
          </div>
          <div className={styles.registerLink}>
            <p>Não possui conta? <span onClick={handleRedirectToRegisterPage}>Cadastre-se</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}
