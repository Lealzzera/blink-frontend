import { apiEndpoints, createApiHeaders } from "./api";

export interface ChatConfig {
  phone_number: string;
  picture_url: string;
  whats_app_name: string;
  last_message: string;
  sent_at: string;
  from_me: boolean;
  ai_answer: boolean;
}

export interface ChatPhoneConfig {
  message_text: string;
  from_me: boolean;
  sent_at: string;
  ack: string;
}

export const chatService = {
  async getOverview(token: string, page: number = 0): Promise<ChatConfig[]> {
    const url = `${apiEndpoints.overview}?page=${page}`;

    const response = await fetch(url, {
      headers: createApiHeaders(token),
      cache: 'no-store' // Para garantir dados frescos
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar endpoint overview: ${response.status}`);
    }

    const data: ChatConfig[] = await response.json();
    return data;
  },

  async getOverviewPhone(token: string, phoneNumber: string, page: number = 0): Promise<ChatPhoneConfig[]> {
    const url = `${apiEndpoints.overviewPhone}/${phoneNumber}?page=${page}`;

    const response = await fetch(url, {
      headers: createApiHeaders(token),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar overviewPhone: ${response.status}`);
    }

    const data: ChatPhoneConfig[] = await response.json();
    return data;
  },
};