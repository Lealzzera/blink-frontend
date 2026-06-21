'use client';

import InputComponent from '@/app/components/InputComponent/InputComponent';
import SelectComponent from '@/app/components/SelectComponent/SelectComponent';
import { useState } from 'react';
import styles from './styles.module.css';

type RegisterClinicInfoComponentProps = {
  clinicTypeOptions: { value: string; label: string }[];
  clinicTypeValue: string;
  setClinicTypeValue: (value: string) => void;
  clinicNameValue: string;
  setClinicNameValue: (value: string) => void;
  clinicPhoneNumber: string;
  setClinicPhoneNumber: (value: string) => void;
  clinicPostalCode: string;
  setClinicPostalCode: (value: string) => void;
  clinicAddress: string;
  setClinicAddress: (value: string) => void;
  clinicAddressNumber: string;
  setClinicAddressNumber: (value: string) => void;
  clinicCity: string;
  setClinicCity: (value: string) => void;
  clinicState: string;
  setClinicState: (value: string) => void;
};

type Address = {
  bairro: string;
  cep: string;
  complemento: string;
  ddd: string;
  estado: string;
  gia: string;
  ibge: string;
  localidade: string;
  logradouro: string;
  regiao: string;
  siafi: string;
  uf: string;
  unidade: string;
};

export default function RegisterClinicInfo({
  clinicNameValue,
  setClinicNameValue,
  clinicTypeOptions,
  clinicTypeValue,
  setClinicTypeValue,
  clinicPostalCode,
  setClinicPostalCode,
  clinicPhoneNumber,
  setClinicPhoneNumber,
  clinicAddress,
  setClinicAddress,
  clinicAddressNumber,
  setClinicAddressNumber,
  clinicCity,
  setClinicCity,
  clinicState,
  setClinicState,
}: RegisterClinicInfoComponentProps) {
  const [address, setAddress] = useState<Address | ''>('');
  const findAddressByPostalCode = async () => {
    if (clinicPostalCode.length < 8) return;
    const postalCodeWithoutDash = clinicPostalCode.replace('-', '');
    const response = await fetch(`https://viacep.com.br/ws/${postalCodeWithoutDash}/json/`);
    const data = await response.json();
    setAddress(data);
    setClinicAddress(data.logradouro);
    setClinicCity(data.localidade);
    setClinicState(data.estado);
  };

  const formatPhoneNumber = (value: string) => {
    const cleanedPhone = value.replace(/\D/g, '');

    if (cleanedPhone.length <= 10) {
      return cleanedPhone
        .replace(/^(\d{2})(\d)/, '($1)$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 13);
    }
    return cleanedPhone
      .replace(/^(\d{2})(\d)/, '($1)$2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 14);
  };

  const handlePhoneNumberChange = (value: string) => {
    const cleanedPhoneNumber = value.replace(/\D/g, '');

    if (cleanedPhoneNumber.length > 11) return;

    const formatted = formatPhoneNumber(cleanedPhoneNumber);
    setClinicPhoneNumber(formatted);
  };

  const formatPostalCode = (value: string) => {
    const cleanedPostalCode = value.replace(/\D/g, '');
    return cleanedPostalCode.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const handlePostalCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length > 8) return;

    const formatted = formatPostalCode(cleaned);
    setClinicPostalCode(formatted);
  };

  return (
    <section className={styles.clinicInfoSection}>
      <h2>Informações da clínica</h2>
      <p>Agora nos conte mais sobre o seu negócio.</p>
      <div className={styles.formGrid}>
        <div className={styles.clinicNameContainer}>
          <InputComponent
            type="text"
            label="Nome da clínica"
            required
            value={clinicNameValue}
            handleChangeInput={(e) => setClinicNameValue(e.target.value)}
          />
          <SelectComponent
            labelSelect="Tipo de clínica"
            idSelect="clinicType"
            options={clinicTypeOptions}
            value={clinicTypeValue}
            setValue={setClinicTypeValue}
          />
        </div>
        <div className={styles.phoneContainer}>
          <InputComponent
            type="text"
            label="Telefone da clínica"
            required
            placeholder="Digite somente números"
            value={clinicPhoneNumber ?? ''}
            handleChangeInput={(e) => handlePhoneNumberChange(e.target.value)}
          />
          <InputComponent
            type="text"
            label="CEP"
            id="postal-code"
            placeholder="Digite somente números"
            required
            value={clinicPostalCode ?? ''}
            onBlur={findAddressByPostalCode}
            handleChangeInput={(e) => handlePostalCodeChange(e.target.value)}
          />
        </div>
        <div className={styles.addressContainer}>
          <InputComponent
            required
            type="text"
            label="Endereço"
            value={clinicAddress ?? ''}
            handleChangeInput={(e) => setClinicAddress(e.target.value)}
          />
          <InputComponent
            required
            type="text"
            label="Número"
            value={clinicAddressNumber ?? ''}
            handleChangeInput={(event) => setClinicAddressNumber(event.target.value)}
          />
        </div>
        <div className={styles.cityContainer}>
          <InputComponent
            required
            type="text"
            label="Cidade"
            value={clinicCity ?? ''}
            handleChangeInput={(e) => setClinicCity(e.target.value)}
          />
          <InputComponent
            required
            type="text"
            label="Estado"
            value={clinicState ?? ''}
            handleChangeInput={(e) => setClinicState(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
