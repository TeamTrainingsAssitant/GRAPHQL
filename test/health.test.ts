import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const yoga = createApp();

async function query(body: object, headers: Record<string, string> = {}) {
  return yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('health', () => {
  it('liefert status ok und einen ISO-Zeitstempel', async () => {
    const response = await query({ query: '{ health { status time } }' });
    const { data } = await response.json();

    expect(response.status).toBe(200);
    expect(data.health.status).toBe('ok');
    expect(new Date(data.health.time).toISOString()).toBe(data.health.time);
  });

  it('erlaubt CORS für einen konfigurierten Origin', async () => {
    const response = await query(
      { query: '{ health { status } }' },
      { Origin: 'http://localhost:4200' },
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4200');
  });
});
