import { config } from '../config.js';
import { mapBackendError, upstreamUnavailable } from '../errors/mapBackendError.js';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface BackendClientOptions {
  // Bearer-Token des Aufrufers, wird nur durchgereicht (das Gateway hat keine Session)
  token?: string;
  baseUrl?: string;
  timeoutMs?: number;
  // austauschbar für Tests
  fetchImpl?: typeof fetch;
}

export interface BackendClient {
  request<T>(method: Method, path: string, body?: unknown): Promise<T>;
}

export function createBackendClient(options: BackendClientOptions = {}): BackendClient {
  const {
    token,
    baseUrl = config.backendBaseUrl,
    timeoutMs = 10_000,
    fetchImpl = fetch,
  } = options;

  async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw upstreamUnavailable();
    }

    // Antworten ohne Inhalt (oder ohne gültiges JSON) werden als leer behandelt
    const payload: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : `Backend error (${response.status}).`;
      throw mapBackendError(response.status, message);
    }

    return payload as T;
  }

  return { request };
}
