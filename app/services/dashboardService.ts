import { apiEndpoints, createApiHeaders } from "./api"

export interface DashboardConfig {
  received_messages_count_total: number,
  appointments_count_total: number,
  show_ups_count_total: number,
  sales_count_total: number,
  sales_value_total: number
}

export const dashboardService = {
  async getDashboard(token: string, startDate: string, endDate: string, value: number): Promise<DashboardConfig> {
    const url = `${apiEndpoints.dashboardInfo(value)}?startDate=${startDate}&endDate=${endDate}`

    const response = await fetch(url, {
      mode: "cors",
      headers: createApiHeaders(token)
    }) 

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`)
    }

    const data: DashboardConfig = await response.json()
    console.log("📊 Dados brutos recebidos:", data)

    return data
  }
}
