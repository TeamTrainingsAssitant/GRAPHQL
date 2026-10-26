import { GraphQLError } from 'graphql';
import { createBackendClient, type BackendClient } from './clients/backendClient.js';

export interface GraphQLContext {
  token: string | undefined;
  backend: BackendClient;
}

// Für Resolver, die den Token selbst brauchen (z. B. logout) und nicht nur durchreichen
export function requireToken(context: GraphQLContext): string {
  if (!context.token) {
    throw new GraphQLError('Not authenticated.', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return context.token;
}

// Liest den Token aus "Authorization: Bearer <token>"
export function extractToken(header: string | null): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1];
}

// Wird pro Anfrage aufgerufen: jede Anfrage bekommt einen eigenen Client mit ihrem eigenen Token
export function createContext({ request }: { request: Request }): GraphQLContext {
  const token = extractToken(request.headers.get('authorization'));
  return { token, backend: createBackendClient({ token }) };
}
