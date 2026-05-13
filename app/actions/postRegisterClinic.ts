import axios from 'axios';
import { ServiceType } from '../register/components/register-clinic-services/RegisterClinicServices';
import { WorkingHour } from '../register/components/register-clinic-working-hours/RegisterClinicWorkingHours';
import { SettingsObject } from '../types/types';

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
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL}/clinic/register`,
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
