  import { apiEndpoints, createApiHeaders } from "./api"

  export interface ChatConfig {
    phone_number: string
    picture_url: string
    whats_app_name: string
    last_message: string
    sent_at: string
    from_me: boolean
    ai_answer: boolean
  }

  export interface ChatPhoneConfig {
    message_text: string
    from_me: boolean
    sent_at: string
    ack: string
  }

  export const chatService = {
    async getOverview(token: string): Promise<ChatConfig[]> {
      const response = await fetch(apiEndpoints.overview, {
        mode: "cors",
        headers: createApiHeaders(token),
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar overview: ${response.status}`)
      }

      const data: ChatConfig[] = await response.json()
      return data
    },

    async getOverviewPhone(token: string, phoneNumber: string): Promise<ChatPhoneConfig[]> {
      const url = `${apiEndpoints.overviewPhone}/${phoneNumber}`

      const response = await fetch(url, {
        mode: "cors",
        headers: createApiHeaders(token),
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar overviewPhone: ${response.status}`)
      }

      const data: ChatPhoneConfig[] = await response.json()
      return data
    },
  }
