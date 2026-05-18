'use server';

import { serverApi } from './serverApi';

export type PutClinicConfigurationBody = {
  clinicId: string;
  chargesEvaluation: boolean;
  evaluationPriceCents: number;
  maxAppointmentsPerSlot: number;
  appointmentDurationMinutes: number;
  allowRescheduling: boolean;
  allowCancellation: boolean;
  aiAgentName: string;
  clinicName?: string;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
};

export async function putClinicConfiguration({
  clinicId,
  ...body
}: PutClinicConfigurationBody) {
  return await serverApi({
    method: 'POST',
    url: `/clinic-settings/${clinicId}`,
    data: body,
  });
}
