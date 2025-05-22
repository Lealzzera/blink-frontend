// components/MessageBox.tsx
import { useEffect, useState } from "react";
import styles from "./styles/message-box.module.css";

interface Props {
  message: string;
  type: "success" | "error";
  onHide: () => void;
}

export default function MessageBox({ message, type, onHide }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false);
      onHide();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onHide]);

  if (!visible) return null;

  return (
    <div className={`${styles.message} ${styles[type]}`}>
      {type === "success" ? "✔️" : "❌"} {message}
    </div>
  );
}
