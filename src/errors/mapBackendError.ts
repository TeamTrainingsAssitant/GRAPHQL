import { GraphQLError } from 'graphql';

// Übersetzt HTTP-Status des Backends in GraphQL-Fehlercodes (extensions.code),
// damit das Frontend nicht mehr auf Statuscodes prüfen muss.
const CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_USER_INPUT',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  502: 'UPSTREAM_UNAVAILABLE',
};

export function mapBackendError(status: number, message: string): GraphQLError {
  const code = CODE_BY_STATUS[status] ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BACKEND_ERROR');
  return new GraphQLError(message, { extensions: { code, status } });
}

// Backend nicht erreichbar, Timeout oder Verbindungsabbruch
export function upstreamUnavailable(): GraphQLError {
  return new GraphQLError('Backend not reachable.', {
    extensions: { code: 'UPSTREAM_UNAVAILABLE' },
  });
}
