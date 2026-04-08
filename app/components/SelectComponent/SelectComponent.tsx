import styles from './styles.module.css'

type SelectOptions = {
    value: string;
    label: string;
}

type SelectComponentProps = {
    labelSelect: string;
    idSelect: string;
    options: SelectOptions[];
    setValue: (value: string) => void;
    value: string;
}

export default function SelectComponent({ labelSelect, idSelect, options, setValue, value }: SelectComponentProps) {
    return (
        <div className={styles.selectContainer}>
            <label htmlFor={idSelect}>{labelSelect}</label>
            <select id={idSelect} value={value} onChange={(e) => setValue(e.target.value)}>
                <option value="" disabled defaultValue={""}>Selecione o tipo de clínica</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}