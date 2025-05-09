// pages/dashboard.tsx

import styles from './dashboard.module.css'
import Head from 'next/head'

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className={styles.periodSelector}>
        <button>Hoje</button>
        <button>Esta Semana</button>
        <button>Este Mês</button>
        <button>Personalizado</button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
            <h3 className={styles.title}>Gasto em Mídia (Meta Ads)</h3>
            <h2>99</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Novas Mensagens</h3>
            <h2>99</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Agendamentos Realizados</h3>
            <h2>99</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Taxa de Comparecimento</h3>
            <h2>99</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Vendas (Quantidade)</h3>
            <h2>99</h2>
        </div>
        <div className={styles.card}>
            <h3 className={styles.title}>Valor Total de Vendas</h3>
            <h2>99</h2>
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
