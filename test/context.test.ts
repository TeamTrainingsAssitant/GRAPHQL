import { describe, expect, it } from 'vitest';
import { createContext, extractToken } from '../src/context.js';

describe('extractToken', () => {
  it('liest den Token aus einem Bearer-Header', () => {
    expect(extractToken('Bearer abc123')).toBe('abc123');
    expect(extractToken('bearer abc123')).toBe('abc123');
  });

  it('liefert undefined ohne oder mit anderem Header', () => {
    expect(extractToken(null)).toBeUndefined();
    expect(extractToken('Basic abc')).toBeUndefined();
  });
});

describe('createContext', () => {
  it('setzt den Token aus dem Request in den Kontext', () => {
    const request = new Request('http://localhost/graphql', {
      headers: { Authorization: 'Bearer t0ken' },
    });

    expect(createContext({ request }).token).toBe('t0ken');
  });
});
