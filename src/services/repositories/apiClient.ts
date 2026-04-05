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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const fallbackMessage = `Backend error (${response.status})`;
    throw new ApiRequestError(errorMessageFromPayload(payload, fallbackMessage), response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
