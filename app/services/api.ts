const BASE_URL = 'https://be.blinkdentalmarketing.com.br/api/v1';

export const createApiHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

export const apiEndpoints = {
  whatsappStatus: `${BASE_URL}/message/whats-app/1/status`,
  whatsappQrCode: `${BASE_URL}/message/whats-app/1/qr-code`,
  availability: `${BASE_URL}/configurations/availability/1`,
  availabilityConfig: `${BASE_URL}/configurations/availability`,
  appointments: `${BASE_URL}/configurations/appointments/1`,
  appointmentsConfig: `${BASE_URL}/configurations/appointments`,
  exceptions: `${BASE_URL}/configurations/availability/1/exception`,
  exceptionsConfig: `${BASE_URL}/configurations/availability/exception`,
  overview: `${BASE_URL}/chat/1/overview`,
  dashboardInfo: `${BASE_URL}/dashboards/1`
};