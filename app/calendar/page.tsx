import dynamic from "next/dynamic"
import styles from "./calendar.module.css" 

// Isso é necessário porque o FullCalendar depende de objetos do navegador (como `window`)
const Calendario = dynamic(() => import("@/components/calendario"), { ssr: false })

export default function CalendarPage() {
  return (
    <div className={styles.pageContainer}>
      <Calendario />
    </div>
  )
}