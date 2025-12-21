import { ContactSelected } from "@/app/context/userContext";
import styles from "./style.module.css";
import Image from "next/image";

type ChatCardComponentProps = {
  imageUrl?: string;
  lastMessage?: string;
  phoneNumber?: string;
  sentAt?: string;
  contactName?: string;
  cardSelected?: ContactSelected | null;
  cardClick: () => void;
};

export default function ChatCardComponent({
  contactName,
  imageUrl,
  lastMessage,
  phoneNumber,
  sentAt,
  cardSelected,
  cardClick,
}: ChatCardComponentProps) {
  return (
    <div
      onClick={cardClick}
      className={`${styles.cardContainer} ${
        cardSelected?.phone_number === phoneNumber ? styles.cardSelected : ""
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
      <div className={styles.timeContainer}>
        <p>{sentAt}</p>
      </div>
    </div>
  );
}
