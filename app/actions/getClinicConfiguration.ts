'use server';

import { serverApi } from './serverApi';

export type ClinicConfigurationResponse = {
  clinicName: string;
  clinicType: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  chargesEvaluation: boolean;
  evaluationPriceCents: number | null;
  maxAppointmentsPerSlot: number | null;
  appointmentDurationMinutes: number | null;
  allowRescheduling: boolean;
  allowCancellation: boolean;
  aiAgentName: string | null;
};

export async function getClinicConfiguration(
  clinicId: string,
): Promise<ClinicConfigurationResponse | null> {
  const clinicConfiguration = await serverApi({
    url: `/clinic-settings/${clinicId}`,
  });

  return clinicConfiguration;
}
