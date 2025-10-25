import { apiEndpoints, createApiHeaders } from './api';

export interface WhatsAppStatus {
  status: string;
  connected_phone_number?: string;
}

export const whatsappService = {
  async getStatus(token: string, value: number): Promise<WhatsAppStatus> {
    const response = await fetch(apiEndpoints.whatsappStatus(value), {
      mode: "cors",
      headers: createApiHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Status API error: ${response.status}`);
    }

    return response.json();
  },

  async getQrCode(token: string, value: number): Promise<Blob> {
    const response = await fetch(apiEndpoints.whatsappQrCode(value), {
      mode: "cors",
      headers: {
        'Accept': 'image/png',
        'Authorization': `Bearer ${token}`,
      }
      
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar o QR Code: ${response.status}`);
    }

    return response.blob();
  }
};