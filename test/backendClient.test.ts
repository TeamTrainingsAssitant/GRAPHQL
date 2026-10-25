import { describe, expect, it, vi } from 'vitest';
import { createBackendClient } from '../src/clients/backendClient.js';

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clientWith(fetchImpl: typeof fetch, token?: string) {
  return createBackendClient({ baseUrl: 'http://backend/api/v1', token, fetchImpl });
}

describe('backendClient', () => {
  it('ruft die richtige URL auf und reicht den Bearer-Token durch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { userId: 1 }));

    const result = await clientWith(fetchImpl, 'abc').request('GET', '/users/me');

    expect(result).toEqual({ userId: 1 });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('http://backend/api/v1/users/me');
    expect(init.headers.Authorization).toBe('Bearer abc');
  });

  it('sendet kein Authorization-Header ohne Token und serialisiert den Body als JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, { userId: 2 }));

    await clientWith(fetchImpl).request('POST', '/users', { username: 'a' });

    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"username":"a"}');
  });

  it.each([
    [400, 'BAD_USER_INPUT'],
    [401, 'UNAUTHENTICATED'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [502, 'UPSTREAM_UNAVAILABLE'],
    [500, 'INTERNAL_SERVER_ERROR'],
  ])('übersetzt HTTP %i in den Code %s und übernimmt die Backend-Meldung', async (status, code) => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(status, { message: 'Boom.' }));

    await expect(clientWith(fetchImpl).request('GET', '/x')).rejects.toMatchObject({
      message: 'Boom.',
      extensions: { code, status },
    });
  });

  it('nutzt eine Standardmeldung, wenn die Fehlerantwort kein JSON enthält', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('oops', { status: 503 }));

    await expect(clientWith(fetchImpl).request('GET', '/x')).rejects.toMatchObject({
      message: 'Backend error (503).',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });

  it('meldet UPSTREAM_UNAVAILABLE, wenn das Backend nicht erreichbar ist', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    await expect(clientWith(fetchImpl).request('GET', '/x')).rejects.toMatchObject({
      extensions: { code: 'UPSTREAM_UNAVAILABLE' },
    });
  });
});
