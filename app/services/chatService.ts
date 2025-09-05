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
    try {
      const url = `${apiEndpoints.overview}?page=${page}`;

      const response = await fetch(url, {
        headers: createApiHeaders(token),
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn(`Erro ao buscar overview: ${response.status}`);
        return [];
      }

      const data: ChatConfig[] = await response.json();
      return data;
    } catch (error) {
      console.error("Erro em getOverview:", error);
      return [];
    }
  },

  async getOverviewPhone(token: string, phoneNumber: string, page: number = 0): Promise<ChatPhoneConfig[]> {
    try {
      const url = `${apiEndpoints.overviewPhone}/${phoneNumber}?page=${page}`;

      const response = await fetch(url, {
        headers: createApiHeaders(token),
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn(`Erro ao buscar overviewPhone: ${response.status}`);
        return [];
      }

      const data: ChatPhoneConfig[] = await response.json();
      return data;
    } catch (error) {
      console.error("Erro em getOverviewPhone:", error);
      return [];
    }
  },
};