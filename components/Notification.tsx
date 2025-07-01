"use client";

import { useEffect, useState } from "react";
import styles from "@/components/styles/notification.module.css";

type NotificationType = "success" | "warning" | "error";

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose?: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 5000,
}: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.message}>{message}</span>
        <button className={styles.closeButton} onClick={() => setVisible(false)}>
          &times;
        </button>
      </div>
    </div>
  );
}