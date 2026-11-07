import { graphql } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { buildContext } from '../src/context.js';
import { schema } from '../src/schema/index.js';

// Führt eine Abfrage gegen das echte Schema aus, das Backend ist durch eine Attrappe ersetzt
function run(source: string, backendResult: unknown, token?: string) {
  const request = vi.fn().mockResolvedValue(backendResult);
  const contextValue = buildContext(token, { request });
  return graphql({ schema, source, contextValue }).then((result) => ({ result, request }));
}

describe('Auth', () => {
  it('register ruft POST /users mit dem Input auf', async () => {
    const { result, request } = await run(
      `mutation { register(input: {username: "a", email: "a@b.de", password: "12345678"}) { message userId } }`,
      { message: 'User created.', userId: 7 },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ register: { message: 'User created.', userId: '7' } });
    expect(request).toHaveBeenCalledWith('POST', '/users', {
      username: 'a',
      email: 'a@b.de',
      password: '12345678',
    });
  });

  it('login liefert den Token', async () => {
    const { result, request } = await run(
      `mutation { login(input: {email: "a@b.de", password: "12345678"}) { token } }`,
      { message: 'User logged on.', token: 'tok' },
    );

    expect(result.data).toEqual({ login: { token: 'tok' } });
    expect(request).toHaveBeenCalledWith('POST', '/auth', { email: 'a@b.de', password: '12345678' });
  });

  it('logout schickt den Token aus dem Header im Body an DELETE /auth', async () => {
    const { result, request } = await run(
      `mutation { logout { message } }`,
      { message: 'User logged off.' },
      'tok',
    );

    expect(result.data).toEqual({ logout: { message: 'User logged off.' } });
    expect(request).toHaveBeenCalledWith('DELETE', '/auth', { token: 'tok' });
  });

  it('logout ohne Token meldet UNAUTHENTICATED und ruft das Backend nicht auf', async () => {
    const { result, request } = await run(`mutation { logout { message } }`, {});

    expect(result.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(request).not.toHaveBeenCalled();
  });
});

describe('User', () => {
  it('me liefert den Nutzer', async () => {
    const { result, request } = await run(
      `{ me { userId username email createdAt } }`,
      { userId: 1, username: 'a', email: 'a@b.de', createdAt: '2026-10-26' },
      'tok',
    );

    expect(result.data).toEqual({
      me: { userId: '1', username: 'a', email: 'a@b.de', createdAt: '2026-10-26' },
    });
    expect(request).toHaveBeenCalledWith('GET', '/users/me');
  });

  it('exportMyData liefert Pläne mit Übungen, nur angefragte Felder', async () => {
    const { result } = await run(
      `{ exportMyData { user { username } plans { name exercises { name sets reps } } } }`,
      {
        user: { userId: 1, username: 'a', email: 'a@b.de', createdAt: '2026-10-26' },
        plans: [
          {
            id: 3,
            name: 'Push',
            createdAt: '2026-10-26T10:00:00',
            updatedAt: '2026-10-26T10:00:00',
            exercises: [{ id: 9, name: 'Bench Press', sets: 3, reps: 10, weight: 60 }],
          },
        ],
      },
      'tok',
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      exportMyData: {
        user: { username: 'a' },
        plans: [{ name: 'Push', exercises: [{ name: 'Bench Press', sets: 3, reps: 10 }] }],
      },
    });
  });

  it('deleteAccount schickt das Passwort an DELETE /users/me', async () => {
    const { result, request } = await run(
      `mutation { deleteAccount(password: "geheim123") { message } }`,
      { message: 'Account deleted.' },
      'tok',
    );

    expect(result.data).toEqual({ deleteAccount: { message: 'Account deleted.' } });
    expect(request).toHaveBeenCalledWith('DELETE', '/users/me', { password: 'geheim123' });
  });
});
