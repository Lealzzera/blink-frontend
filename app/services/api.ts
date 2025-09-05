const NEXT_PUBLIC_BLINK_BE_BASE_URL=process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL
const NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK=process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK || 'http://blink-be-dev:3003/api/v1'
console.log(NEXT_PUBLIC_BLINK_BE_BASE_URL)

export const createApiHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export const apiEndpoints = {
  whatsappStatus: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/message/whats-app/1/status`,
  whatsappQrCode: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/message/whats-app/1/qr-code`,
  availability: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability/1`,
  availabilityConfig: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability`,
  appointments: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/appointments/1`,
  appointmentsConfig: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/appointments`,
  exceptions: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability/1/exception`,
  exceptionsConfig: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/configurations/availability/exception`,
  overview: `${NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK}/chat/1/overview`,
  overviewPhone: `${NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK}/chat/1/overview`,
  dashboardInfo: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/dashboards/1`
};