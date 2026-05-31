import styles from './styles.module.css';

type TextAreaComponentProps = {
  resize?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  id: string;
  rows?: number;
};

export function TextAreaComponent({
  resize,
  placeholder,
  value,
  onChange,
  name,
  id,
  rows = 5,
}: TextAreaComponentProps) {
  return (
    <div className={styles.textAreaContainer}>
      <textarea
        name={name}
        id={id}
        placeholder={placeholder}
        value={value}
        rows={rows}
        className={`${styles.textArea} ${!resize ? styles.blockResize : ''}`}
        onChange={(e) => onChange(e.target.value)}
      ></textarea>
    </div>
  );
}
