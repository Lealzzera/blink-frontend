import styles from "./style.module.css";

type MessageComponentProps = {
  message: any;
};

export default function MessageComponent({ message }: MessageComponentProps) {
  console.log(message);
  return (
    <div
      className={`${styles.messageBaloonContainer} ${
        message.from_me ? styles.fromMe : styles.fromPatient
      }`}
    >
      {message.message_text}
    </div>
  );
}
