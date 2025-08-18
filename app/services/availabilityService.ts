import { apiEndpoints, createApiHeaders } from './api';

export interface WorkDay {
  clinic_id: number;
  week_day: string;
  is_work_day: boolean;
  open: string | null;
  close: string | null;
  break_start: string | null;
  break_end: string | null;
}

export const availabilityService = {
  async getAvailability(token: string): Promise<WorkDay[]> {
    const response = await fetch(apiEndpoints.availability, {
      headers: createApiHeaders(token)
    });

    if (!response.ok) {
      throw new Error(`Erro ao carregar disponibilidade: ${response.status}`);
    }

    return response.json();
  },

  async updateAvailability(token: string, workDays: WorkDay[]): Promise<void> {
    const response = await fetch(apiEndpoints.availabilityConfig, {
      method: "PUT",
      headers: createApiHeaders(token),
      body: JSON.stringify(workDays),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }
  }
};