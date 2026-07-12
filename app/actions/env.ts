export function getServerApiBaseUrl(): string {
  const baseUrl =
    process.env.BLINK_BE_INTERNAL_BASE_URL ||
    process.env.NEXT_PUBLIC_BLINK_BE_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      'BLINK_BE_INTERNAL_BASE_URL e NEXT_PUBLIC_BLINK_BE_BASE_URL não foram configuradas',
    );
  }

  return baseUrl.replace(/\/+$/, '');
}

export function getWebsocketUrl(): string {
  const websocketUrl =
    process.env.BLINK_BE_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_BLINK_BE_PUBLIC_WS_URL;

  if (!websocketUrl) {
    throw new Error('WebSocket URL não configurada');
  }

  return websocketUrl.replace(/\/+$/, '');
}