import styles from "./style.module.css";

type SwitchComponentProps = {
  handleToggle: () => void;
  isOn: boolean;
  label?: string;
};

export default function SwitchComponent({
  handleToggle,
  isOn,
  label,
}: SwitchComponentProps) {
  return (
    <label
      className={styles.checkboxContainer}
      title={label}
      aria-label={label}
    >
      <input
        checked={isOn}
        onChange={handleToggle}
        className={styles.checkbox}
        type="checkbox"
        aria-checked={isOn}
      />
      <span className={styles.switch} />

      {label && <span className={styles.tooltip}>{label}</span>}
    </label>
  );
}
