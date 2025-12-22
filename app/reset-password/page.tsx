"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import styles from "./styles.module.css";
import InputComponent from "../components/InputComponent/InputComponent";
import ButtonComponent from "../components/ButtonComponent/ButtonComponent";

export default function ResetPassword() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  const handleChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres", {
        theme: "colored",
        type: "error",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error("Erro ao redefinir senha. Tente novamente.", {
        theme: "colored",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();

    toast.success("Senha redefinida com sucesso!", {
      theme: "colored",
      type: "success",
    });

    setTimeout(() => {
      router.replace("/");
    }, 1500);
  };

  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/");
        return;
      }

      setLoading(false);
    };

    checkRecoverySession();
  }, []);

  if (loading) {
    return <p>Validando link de recuperação...</p>;
  }

  return (
    <div className={styles.resetPage}>
      <ToastContainer />
      <div className={styles.resetContainer}>
        <h1>Recuperação de senha</h1>
        <p>Digite sua nova senha abaixo para redefinir sua senha de acesso</p>

        <form className={styles.containerInputButton} onSubmit={handleSubmit}>
          <InputComponent
            handleChangeInput={handleChangePassword}
            value={password}
            label="Nova Senha"
            type="password"
            required
          />

          <ButtonComponent
            disabled={submitting}
            text={submitting ? "Enviando..." : "Enviar"}
          />
        </form>
      </div>
    </div>
  );
}
