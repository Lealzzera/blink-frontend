'use server';

import type { ClinicServiceItem } from './getClinicServices';
import { serverApi } from './serverApi';

export type PutClinicServiceItem = Omit<ClinicServiceItem, 'id'> & {
  id?: string;
};

export async function putClinicServices(
  clinicId: string,
  services: PutClinicServiceItem[],
): Promise<{ services: ClinicServiceItem[] } | null> {
  return await serverApi({
    method: 'PUT',
    url: `/clinic-services/${clinicId}`,
    data: { services },
  });
}
