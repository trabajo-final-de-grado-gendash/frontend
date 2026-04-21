const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export class ApiRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.payload = payload;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (isRecord(payload)) {
    const maybeMessage = payload.message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }

    const maybeDetail = payload.detail;
    if (typeof maybeDetail === 'string' && maybeDetail.trim()) {
      return maybeDetail;
    }

    if (Array.isArray(maybeDetail) && maybeDetail.length > 0) {
      const first = maybeDetail[0];
      if (isRecord(first) && typeof first.msg === 'string') {
        return first.msg;
      }
    }
  }

  return fallback;
}

function fallbackMessageByStatus(status: number): string {
  if (status === 400) {
    return 'La solicitud no es valida.';
  }

  if (status === 401 || status === 403) {
    return 'No tienes permisos para realizar esta accion.';
  }

  if (status === 404) {
    return 'No se encontro el recurso solicitado.';
  }

  if (status === 422) {
    return 'La API rechazo la solicitud por datos invalidos.';
  }

  if (status >= 500) {
    return `La API respondio con un error interno (${status}).`;
  }

  return `La API respondio con un error (${status}).`;
}

function normalizeErrorMessage(message: string, status?: number): string {
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'No se pudo conectar con la API. Verifica que el backend este encendido y accesible.';
  }

  if (lower.includes('session not found')) {
    return 'La sesion solicitada no existe.';
  }

  if (lower.includes('result not found')) {
    return 'El resultado solicitado no existe.';
  }

  if (status === 503) {
    return 'La API no esta disponible temporalmente. Intenta nuevamente en unos segundos.';
  }

  return message;
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('Accept', 'application/json');

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    const baseMessage = error instanceof Error ? error.message : 'Error de red';
    throw new ApiRequestError(normalizeErrorMessage(baseMessage), 0, null);
  }

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const fallbackMessage = fallbackMessageByStatus(response.status);
    const rawMessage = errorMessageFromPayload(payload, fallbackMessage);
    const message = normalizeErrorMessage(rawMessage, response.status);
    throw new ApiRequestError(message, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
