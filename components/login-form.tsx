"use client";

import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import styles from "./styles/login-form.module.css";
import { useMyContext } from "../app/context/context";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {setEmailLogin} = useMyContext()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  function handleEmail(e: React.ChangeEvent<HTMLInputElement>){
    setEmail(e.target.value)
    setEmailLogin(e.target.value)  // ISTO SERÁ ENVIADO PARA O CHAT (PAGE.TSX) QUE NO MOMENTO É SSR.
  }

  return (
    <div className={styles.container} {...props}>
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <Image
            src="/images/apenas-img-blink.png"
            alt="Logo da Blink"
            width={40}
            height={40}
          />
          <CardTitle className={styles.title}>Login</CardTitle>
          <CardDescription className={styles.description}>
            Digite seu email e senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <div className={styles.inputGroup}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                  value={email}
                  onChange={handleEmail}
                  className={styles.inputs}
                />
              </div>
              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/auth/forgot-password"
                    className={styles.forgotPassword}
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.inputs}
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <Button
                type="submit"
                className={styles.button}
                disabled={isLoading}
              >
                {isLoading ? "Fazendo login..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
