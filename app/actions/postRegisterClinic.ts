import axios from 'axios';
import { ServiceType } from '../register/components/register-clinic-services/RegisterClinicServices';
import { WorkingHour } from '../register/components/register-clinic-working-hours/RegisterClinicWorkingHours';
import { SettingsObject } from '../types/types';
import { getServerApiBaseUrl } from './env';

type PostAppointmentType = {
  userFullName: string;
  userEmail: string;
  password: string;
  clinicName: string;
  clinicType: string;
  address: string;
  postalCode: string;
  city: string;
  state: string;
  planId: string;
  workingHours: WorkingHour[];
  services: ServiceType[];
  settings: SettingsObject;
};

export async function postRegisterClinic({
  userFullName,
  userEmail,
  password,
  clinicName,
  clinicType,
  address,
  postalCode,
  city,
  state,
  planId,
  workingHours,
  services,
  settings,
}: PostAppointmentType) {
  try {
    const serverApiBaseUrl = getServerApiBaseUrl();
    console.log('[postRegisterClinic] baseURL:', serverApiBaseUrl);
    const response = await axios.post(
      `${serverApiBaseUrl}/clinic/register`,
      {
        userFullName,
        userEmail,
        password,
        clinicName,
        clinicType,
        address,
        postalCode,
        city,
        state,
        planId,
        workingHours,
        services,
        settings,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response;
  } catch (err) {
    console.error('Error to create a new user and clinic:', err);
    return err;
  }
}
