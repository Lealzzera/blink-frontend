"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { resetPassword } from "../actions/resetPassword";
import ButtonComponent from "../components/ButtonComponent/ButtonComponent";
import InputComponent from "../components/InputComponent/InputComponent";
import styles from "./styles.module.css";


function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Link de redefinicao invalido.", { theme: "colored" });
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.", {
        theme: "colored",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas nao conferem.", { theme: "colored" });
      return;
    }

    setSubmitting(true);

    const response = await resetPassword({ token, password });

    if (response.error) {
      toast.error(response.error, { theme: "colored" });
      setSubmitting(false);
      return;
    }

    toast.success("Senha redefinida com sucesso!", { theme: "colored" });

    setTimeout(() => {
      router.replace("/");
    }, 1500);
  };

  return (
    <div className={styles.resetPage}>
      <ToastContainer />
      <div className={styles.resetContainer}>
        <h1>Recuperacao de senha</h1>
        <p>Digite sua nova senha abaixo para redefinir seu acesso.</p>

        <form className={styles.containerInputButton} onSubmit={handleSubmit}>
          <InputComponent
            handleChangeInput={(event) => setPassword(event.target.value)}
            value={password}
            label="Nova senha"
            type="password"
            required
          />

          <InputComponent
            handleChangeInput={(event) => setConfirmPassword(event.target.value)}
            value={confirmPassword}
            label="Confirmar nova senha"
            type="password"
            required
          />

          <ButtonComponent
            disabled={submitting || !token}
            text={submitting ? "Enviando..." : "Enviar"}
          />
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
