import styles from "./styles.module.css";

type ButtonComponentProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  text: string;
  handleClickButton?: () => void;
};

export default function ButtonComponent({
  text,
  handleClickButton,
  ...props
}: ButtonComponentProps) {
  return (
    <div className={styles.buttonContainer}>
      <button {...props} className={styles.button} onClick={handleClickButton}>
        {text}
      </button>
    </div>
  );
}
