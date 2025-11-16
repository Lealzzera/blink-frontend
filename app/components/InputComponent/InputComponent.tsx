import { HTMLInputTypeAttribute } from "react";
import styles from "./styles.module.css";

type InputComponentProps = React.InputHTMLAttributes<HTMLInputElement> & {
  type?: HTMLInputTypeAttribute;
  label?: string;
  value: string | number;
  handleChangeInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
};

export default function InputComponent({
  type = "text",
  placeholder,
  label,
  value,
  handleChangeInput,
  required,
  error,
  ...props
}: InputComponentProps) {
  return (
    <div>
      {label && (
        <label
          className={`${styles.inputLabel} ${required ? styles.required : ""}`}
          htmlFor="input-element"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        id="input-element"
        className={`${styles.inputField} ${error ? styles.error : ""}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChangeInput}
        required={required}
      />
    </div>
  );
}
