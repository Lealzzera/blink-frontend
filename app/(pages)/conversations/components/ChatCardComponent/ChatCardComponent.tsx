import { ContactSelected } from "@/app/context/userContext";
import styles from "./style.module.css";
import Image from "next/image";

type ChatCardComponentProps = {
  imageUrl?: string;
  lastMessage?: string;
  phoneNumber?: string;
  sentAt?: string;
  contactName?: string;
  unreadCount?: number;
  cardSelected?: ContactSelected | null;
  cardClick: () => void;
};

export default function ChatCardComponent({
  contactName,
  imageUrl,
  lastMessage,
  phoneNumber,
  sentAt,
  unreadCount = 0,
  cardSelected,
  cardClick,
}: ChatCardComponentProps) {
  const hasUnreadMessages = unreadCount > 0;

  return (
    <div
      onClick={cardClick}
      className={`${styles.cardContainer} ${
        cardSelected?.phoneNumber === phoneNumber ? styles.cardSelected : ""
      }`}
    >
      <div className={styles.pictureContainer}>
        <Image
          alt="Imagem de perfil do contato"
          src={imageUrl ? imageUrl : "/images/avatar.png"}
          width={50}
          height={50}
          className={styles.imageComponent}
        />
      </div>
      <div className={styles.infoContainer}>
        <p className={styles.contactName}>
          {contactName ? contactName : phoneNumber}
        </p>
        <p className={styles.lastMessage}>{lastMessage}</p>
      </div>
      <div className={styles.statusContainer}>
        <p>{sentAt}</p>
        {hasUnreadMessages && (
          <span className={styles.unreadBadge}>
            {unreadCount > 10 ? "10+" : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}
