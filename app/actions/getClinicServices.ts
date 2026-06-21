'use server';

import { serverApi } from './serverApi';

export type ClinicServiceItem = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
};

export async function getClinicServices(
  clinicId: string,
): Promise<{ services: ClinicServiceItem[] } | null> {
  return await serverApi({
    url: `/clinic-services/${clinicId}`,
  });
}
