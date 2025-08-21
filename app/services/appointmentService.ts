import { apiEndpoints, createApiHeaders } from './api';

export interface AppointmentConfig {
  duration: number;
  overbooking: boolean;
}

export const appointmentService = {
  async getConfig(token: string): Promise<AppointmentConfig> {
    const response = await fetch(apiEndpoints.appointments, {
      mode: "cors",
      headers: createApiHeaders(token)
    });

    if (!response.ok) {
      throw new Error(`Erro ao carregar configurações de agendamento: ${response.status}`);
    }

    return response.json();
  },

  async updateConfig(token: string, config: { clinic_id: number; duration: number; overbooking: boolean }): Promise<void> {
    const response = await fetch(apiEndpoints.appointmentsConfig, {
      method: "PUT",
      headers: createApiHeaders(token),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }
  }
};