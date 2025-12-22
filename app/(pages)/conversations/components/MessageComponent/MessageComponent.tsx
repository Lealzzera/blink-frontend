import styles from "./style.module.css";
import formatMessageTimestamp from "@/utils/formatMessageTimestamp";

type MessageComponentProps = {
  message: any;
};

export default function MessageComponent({ message }: MessageComponentProps) {
  return (
    <div
      className={`${styles.messageBaloonContainer} ${
        message.from_me ? styles.fromMe : styles.fromPatient
      }`}
    >
      <p>{message.message_text ? message.message_text : message.message}</p>
      <span className={styles.sentAt}>
        {formatMessageTimestamp(message.sent_at ? message.sent_at : new Date())}
      </span>
    </div>
  );
}
