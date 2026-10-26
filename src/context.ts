import { GraphQLError } from 'graphql';
import { catalogCache } from './cache/catalogCache.js';
import { TtlCache } from './cache/ttlCache.js';
import { createBackendClient, type BackendClient } from './clients/backendClient.js';
import { createPlanLoaders, type PlanLoaders } from './loaders/planLoaders.js';

export interface GraphQLContext {
  token: string | undefined;
  backend: BackendClient;
  // pro Anfrage neu, sammelt Plan-Abfragen (DataLoader)
  loaders: PlanLoaders;
  // über Anfragen hinweg geteilt, nur für Katalogdaten
  cache: TtlCache<unknown>;
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

// Setzt den Kontext zusammen. Ohne Angabe bekommt jeder Aufruf einen frischen, leeren Cache (praktisch für Tests).
export function buildContext(
  token: string | undefined,
  backend: BackendClient,
  cache: TtlCache<unknown> = new TtlCache({ ttlMs: 60_000 }),
): GraphQLContext {
  return { token, backend, loaders: createPlanLoaders(backend), cache };
}

// Wird pro Anfrage aufgerufen: jede Anfrage bekommt einen eigenen Client und eigene Loader mit ihrem Token
export function createContext({ request }: { request: Request }): GraphQLContext {
  const token = extractToken(request.headers.get('authorization'));
  return buildContext(token, createBackendClient({ token }), catalogCache);
}
