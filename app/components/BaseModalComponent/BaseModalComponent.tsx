import { MouseEvent, useRef } from "react";
import styles from "./style.module.css";

type BaseModalComponent = {
  children: React.ReactNode;
  handleCloseModal: () => void;
};

export default function BaseModalComponent({
  children,
  handleCloseModal,
}: BaseModalComponent) {
  const modalBackground = useRef(null);
  const closeModalClickingOutside = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === modalBackground.current) {
      handleCloseModal();
    }
  };

  return (
    <div
      onClick={(event) => closeModalClickingOutside(event)}
      ref={modalBackground}
      className={styles.modalBackground}
    >
      <div className={styles.modalBody}>{children}</div>
    </div>
  );
}
