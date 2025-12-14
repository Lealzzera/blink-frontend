"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import ButtonComponent from "../components/ButtonComponent/ButtonComponent";
import InputComponent from "../components/InputComponent/InputComponent";
import styles from "./style.module.css";
import { forgotPassword } from "../actions/forgotPassword";
import { toast, ToastContainer } from "react-toastify";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangeEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const response = await forgotPassword(email);
    console.log(response);

    if (response.error) {
      toast("Ocorreu um erro ao enviar o e-mail. Tente novamente mais tarde!", {
        theme: "colored",
        type: "error",
      });
      setLoading(false);
      return;
    }
    toast(
      "E-mail com instruções de redefinição de senha enviado com sucesso!",
      {
        theme: "colored",
        type: "success",
      }
    );
    setLoading(false);
    setEmail("");
  };

  return (
    <div className={styles.forgotPage}>
      <ToastContainer />
      <div className={styles.forgotContainer}>
        <h1>Esqueceu sua senha?</h1>
        <p>
          Digite seu e-mail no campo abaixo e receba as instruções para a troca
          de senha
        </p>
        <form className={styles.containerInputButton} onSubmit={handleSubmit}>
          <InputComponent
            handleChangeInput={handleChangeEmail}
            value={email}
            label="E-mail"
            type="email"
            required
          />
          <ButtonComponent
            disabled={loading}
            text={!loading ? "Enviar" : "Enviando..."}
          />
        </form>
      </div>
    </div>
  );
}
