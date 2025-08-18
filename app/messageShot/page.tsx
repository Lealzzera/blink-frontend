"use client";

import styles from "./messageShot.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function MessageShot() {

  interface Pessoas {
    nome: string,
    nmr: number
  }

  const pessoas: Pessoas[] = [
    {
    nome: 'Lucas', nmr: 11989898989,
    },
    {
    nome: 'Andressa', nmr: 11989898989,
    },
    {
    nome: 'Luiza', nmr: 11989898989,
    },
]

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
            <div className={styles.headerSelect}>
                <select name="filter" id="filter" className={styles.filter}>
                  <option value="placeholder" selected>Classificar</option>
                  <option value="Valor1">Opcao 1</option>
                  <option value="Valor2">Opcao 2</option>
                  <option value="Valor3">Opcao 3</option>
                </select>
                <Button className={styles.button}>
                    Selecionar Todos
                </Button>
            </div>
              {pessoas.map((pessoa, index) => (
                <>
                  <div className={styles.contacts}>
                      <input type="radio" />
                      <h1 key={index}><strong>{pessoa.nome}</strong> - {pessoa.nmr}</h1>
                  </div>
                </>
              ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
