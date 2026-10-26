import type { BackendClient } from './backendClient.js';

// Alle Felder außer den ersten fünf liefert das Backend nur bei einem Teil der Endpunkte
export interface BackendExercise {
  externalId: string;
  name: string;
  gifUrl: string | null;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  bodyParts?: string[];
  equipments?: string[];
  instructions?: string[];
}

export interface BackendExerciseList {
  total: number;
  exercises: BackendExercise[];
}

export interface ExerciseFilter {
  name?: string | null;
  muscles?: string[] | null;
  offset?: number;
  limit?: number;
}

// Hängt nur gesetzte Parameter an; muscles wird wie im REST-API kommagetrennt übergeben
function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const exerciseApi = {
  search: (client: BackendClient, name: string, limit: number) =>
    client.request<BackendExercise[]>('GET', `/exercises${query({ name, limit })}`),

  list: (client: BackendClient, filter: ExerciseFilter) =>
    client.request<BackendExerciseList>(
      'GET',
      `/exercisedb/exercises${query({
        name: filter.name,
        muscles: filter.muscles?.join(','),
        offset: filter.offset,
        limit: filter.limit,
      })}`,
    ),

  get: (client: BackendClient, externalId: string) =>
    client.request<BackendExercise>(
      'GET',
      `/exercisedb/exercises/${encodeURIComponent(externalId)}`,
    ),

  muscles: (client: BackendClient) => client.request<string[]>('GET', '/exercisedb/muscles'),

  bodyParts: (client: BackendClient) => client.request<string[]>('GET', '/exercisedb/bodyparts'),
};
