"use client";

import {
  MessageCircle,
  ChartColumnBig,
  Calendar,
  Settings,
} from "lucide-react";
import Link from "next/link";
import styles from "./style.module.css";
import { usePathname } from "next/navigation";

export default function SidebarComponent() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className={styles.sidebar} aria-label="Sidebar">
      <ul className={styles.menu}>
        <li className={styles.item}>
          <Link
            href="/conversations"
            className={`${styles.link} ${
              isActive("/conversations") ? styles.active : ""
            }`}
          >
            <MessageCircle className={styles.icon} />
            <span className={styles.tooltip}>Conversas</span>
          </Link>
        </li>

        {/* <li className={styles.item}>
          <Link
            href="/dashboard"
            className={`${styles.link} ${
              isActive("/dashboard") ? styles.active : ""
            }`}
          >
            <ChartColumnBig className={styles.icon} />
            <span className={styles.tooltip}>Dashboard</span>
          </Link>
        </li> */}
        <li className={styles.item}>
          <Link
            href="/schedules"
            className={`${styles.link} ${
              isActive("/schedules") ? styles.active : ""
            }`}
          >
            <Calendar className={styles.icon} />
            <span className={styles.tooltip}>Agendamentos</span>
          </Link>
        </li>
      </ul>
      <ul className={styles.menu}>
        <li className={styles.item}>
          <Link
            href="/settings"
            className={`${styles.link} ${
              isActive("/settings") ? styles.active : ""
            }`}
          >
            <Settings className={styles.icon} />
            <span className={styles.tooltip}>Configurações</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
