import styles from "./calendar.module.css";
import CalendarioServer from "@/components/CalendarioServer";

export default function CalendarPage() {
  return (
    <div className={styles.pageContainer}>
      <CalendarioServer />
    </div>
  );
}
