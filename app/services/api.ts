const NEXT_PUBLIC_BLINK_BE_BASE_URL=process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL
const NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK=process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK

export const createApiHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export const apiEndpoints = {
  whatsappStatus: (value: number) => `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/message/whats-app/${value}/status`,
  whatsappQrCode: (value: number) => `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/message/whats-app/${value}/qr-code`,
  availability: (value: number) => `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability/${value}`,
  availabilityConfig: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability`,
  appointments: (value: number) => `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/appointments/${value}`,
  appointmentsConfig: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/appointments`,
  exceptions: (value:number) => `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability/${value}/exception`,
  exceptionsConfig: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability/exception`,
  dashboardInfo: (value:number) => `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/dashboards/${value}`,
};
