"use client";

import styles from "./messageShot.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function MessageShot() {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardContent>
          <h2 className={styles.title}>Enviar Mensagem</h2>

          <Input className={styles.input} placeholder="Digite a mensagem que deseja enviar..." />

          <Button className={styles.button}>
            <Send className="mr-2" size={16} />
            Disparar mensagens
          </Button>

          <div className={styles.contactsSection}>
            <h3 className={styles.contactsTitle}>Contatos selecionados</h3>
            <ul className={styles.contactsList}>
              <li className={styles.contactItem}>
                <span className={styles.contactName}>Lucas Benini</span> – 11999999999
              </li>
              <li className={styles.contactItem}>
                <span className={styles.contactName}>Maria Silva</span> – 11888888888
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
