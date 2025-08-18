// pages/dashboard.tsx
"use client";

import styles from './dashboard.module.css'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { dashboardService, DashboardConfig } from '../services/dashboardService'
import { useAuth } from '../hooks/useAuth';

// Definindo os tipos para os períodos
type Period = 'Hoje' | 'Semana' | 'Mês';

// Função auxiliar para formatar datas
const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

// Função para calcular range de datas
const getDateRange = (period: Period): { startDate: string, endDate: string } => {
  const today = new Date();
  let startDate = formatDate(today);
  let endDate = formatDate(today);

  if (period === "Semana") {
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - 7);
    const lastDay = new Date(today);
    lastDay.setDate(firstDay.getDate() + 7);

    startDate = formatDate(firstDay);
    endDate = formatDate(lastDay);
  }

  if (period === "Mês") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    startDate = formatDate(firstDay);
    endDate = formatDate(lastDay);
  }

  return { startDate, endDate };
};

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Hoje')
  const [data, setData] = useState<DashboardConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getAuthToken } = useAuth();

  // Buscar dados quando o período mudar
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const token = await getAuthToken();
      const { startDate, endDate } = getDateRange(selectedPeriod);

      console.log(`🔎 Buscando dados para período: ${selectedPeriod} (${startDate} → ${endDate}) com token=${token}`)

      try {
        const response = await dashboardService.getDashboard(token, startDate, endDate)
        console.log("✅ Dados recebidos do backend:", response)
        setData(response)
      } catch (err: any) {
        console.error("Erro ao buscar dados do dashboard:", err)
        setError("Erro ao carregar dados.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedPeriod])

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period)
  }

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

      {loading && <p>Carregando dados...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3 className={styles.title}>Novas Mensagens</h3>
            <h2>{data.received_messages_count_total}</h2>
          </div>
          <div className={styles.card}>
            <h3 className={styles.title}>Agendamentos Realizados</h3>
            <h2>{data.appointments_count_total}</h2>
          </div>
          <div className={styles.card}>
            <h3 className={styles.title}>Comparecimento</h3>
            <h2>{data.show_ups_count_total}</h2>
          </div>
          <div className={styles.card}>
            <h3 className={styles.title}>Vendas</h3>
            <h2>{data.sales_count_total}</h2>
          </div>
          <div className={styles.card}>
            <h3 className={styles.title}>Valor Total de Vendas</h3>
            <h2><span className={styles.preText}>R$</span> {data.sales_value_total}</h2>
          </div>
        </div>
      )}

      <div className={styles.charts}>
        <div className={styles.chart}>Taxa de Agendamento x Comparecimentos</div>
        <div className={styles.chart}>Vendas por período</div>
        <div className={styles.chart}>ROI</div>
      </div>
    </div>
  )
}
