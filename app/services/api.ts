const NEXT_PUBLIC_BLINK_BE_BASE_URL = process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL;

// Para evitar problemas de build, usamos a URL externa durante o build
// e a URL interna apenas durante a execução no servidor
const getBaseUrl = () => {
  // Se estiver no build time ou não tiver acesso a process.env (build do Next.js)
  if (typeof window === 'undefined') {
    // Durante o build, usa a URL externa para evitar problemas
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
      return process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL;
    }
    // Durante a execução no servidor, usa a URL interna
    return process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL_DOCK || 'http://blink-be-dev:3003/api/v1';
  }
  // No cliente, usa a URL externa
  return process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL;
};

const BASE_URL = getBaseUrl();

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
  overview: `${BASE_URL}/chat/1/overview`,
  overviewPhone: `${BASE_URL}/chat/1/overview`,
  dashboardInfo: `${NEXT_PUBLIC_BLINK_BE_BASE_URL}/dashboards/1`
};