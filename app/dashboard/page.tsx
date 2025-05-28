// pages/dashboard.tsx
"use client";

import styles from './dashboard.module.css'
import Head from 'next/head'
import { useState } from 'react'

// Definindo os tipos para garantir que 'selectedPeriod' só possa ser uma chave válida
type Period = 'Hoje' | 'Semana' | 'Mês';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Hoje')
  
  // Simulando dados para cada período
  const data: Record<Period, { 
    gastoMídia: number; 
    novasMensagens: number; 
    agendamentos: number; 
    taxaComparecimento: number; 
    vendasQuantidade: number; 
    valorVendas: number;
  }> = {
    Hoje: { gastoMídia: 99, novasMensagens: 99, agendamentos: 99, taxaComparecimento: 99, vendasQuantidade: 99, valorVendas: 99 },
    Semana: { gastoMídia: 250, novasMensagens: 200, agendamentos: 150, taxaComparecimento: 75, vendasQuantidade: 80, valorVendas: 1200 },
    Mês: { gastoMídia: 1000, novasMensagens: 500, agendamentos: 300, taxaComparecimento: 80, vendasQuantidade: 200, valorVendas: 5000 }
  }

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period)
  }

  const selectedData = data[selectedPeriod];

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard</title>
      </Head>

      <div className={styles.periodSelector}>
        <button onClick={() => handlePeriodChange('Hoje')}>Hoje</button>
        <button onClick={() => handlePeriodChange('Semana')}>Esta Semana</button>
        <button onClick={() => handlePeriodChange('Mês')}>Este Mês</button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
            <h3 className={styles.title}>Gasto em Mídia (Meta Ads)</h3>
            <h2><span className={styles.preText}>R$</span> {selectedData.gastoMídia}</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Novas Mensagens</h3>
            <h2>{selectedData.novasMensagens}</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Agendamentos Realizados</h3>
            <h2>{selectedData.agendamentos}</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Comparecimento</h3>
            <h2>{selectedData.taxaComparecimento}</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Vendas</h3>
            <h2>{selectedData.vendasQuantidade}</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Valor Total de Vendas</h3>
            <h2><span className={styles.preText}>R$</span> {selectedData.valorVendas}</h2>
        </div>
      </div>

      <div className={styles.charts}>
        <div className={styles.chart}>Tendências de Agendamento x Comparecimentos</div>
        <div className={styles.chart}>Vendas por período</div>
        <div className={styles.chart}>ROI</div>
      </div>
    </div>
  )
}
