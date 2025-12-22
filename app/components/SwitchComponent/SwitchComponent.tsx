import styles from "./style.module.css";

type SwitchComponentProps = {
  handleToggle: () => void;
  isOn: boolean;
};

export default function SwitchComponent({
  handleToggle,
  isOn,
}: SwitchComponentProps) {
  return (
    <label
      className={styles.checkboxContainer}
      title={isOn ? "Desligar IA" : "Ligar IA"}
      aria-label={isOn ? "Desligar IA" : "Ligar IA"}
    >
      <input
        checked={isOn}
        onChange={handleToggle}
        className={styles.checkbox}
        type="checkbox"
        aria-checked={isOn}
      />
      <span className={styles.switch} />

      <span className={styles.tooltip}>
        {isOn ? "Desligar IA" : "Ligar IA"}
      </span>
    </label>
  );
}
