import type { BackendClient } from './backendClient.js';
import type { BackendExercise } from './exerciseApi.js';
import type { BackendPlanExercise } from './userApi.js';

// Die Liste liefert exerciseCount aber kein createdAt, der Einzelabruf umgekehrt.
// Beides ist deshalb optional, die fehlenden Felder löst der Plan-Resolver nach.
export interface BackendPlan {
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt: string;
  exerciseCount?: number;
}

interface MessageResponse {
  message: string;
}

export interface PlanInput {
  name: string;
  description?: string | null;
}

export interface ExerciseTrainingInput {
  note?: string | null;
  weight?: number | null;
  sets?: number | null;
  reps?: number | null;
  trainingSets?: { weight: number; reps: number }[] | null;
}

export type AddExerciseInput = ExerciseTrainingInput & { externalId: string };

const plan = (planId: string) => `/plans/${encodeURIComponent(planId)}`;
const exercise = (planId: string, planExerciseId: string) =>
  `${plan(planId)}/exercises/${encodeURIComponent(planExerciseId)}`;

export const planApi = {
  list: (client: BackendClient) => client.request<BackendPlan[]>('GET', '/plans'),

  get: (client: BackendClient, planId: string) => client.request<BackendPlan>('GET', plan(planId)),

  create: (client: BackendClient, input: PlanInput) =>
    client.request<BackendPlan>('POST', '/plans', input),

  update: (client: BackendClient, planId: string, input: PlanInput) =>
    client.request<BackendPlan>('PUT', plan(planId), input),

  delete: (client: BackendClient, planId: string) =>
    client.request<MessageResponse>('DELETE', plan(planId)),

  listExercises: (client: BackendClient, planId: string) =>
    client.request<BackendPlanExercise[]>('GET', `${plan(planId)}/exercises`),

  alternatives: (client: BackendClient, planId: string, planExerciseId: string, limit: number) =>
    client.request<BackendExercise[]>(
      'GET',
      `${exercise(planId, planExerciseId)}/alternatives?limit=${encodeURIComponent(String(limit))}`,
    ),

  addExercise: (client: BackendClient, planId: string, input: AddExerciseInput) =>
    client.request<BackendPlanExercise>('POST', `${plan(planId)}/exercises`, input),

  updateExercise: (
    client: BackendClient,
    planId: string,
    planExerciseId: string,
    input: ExerciseTrainingInput,
  ) => client.request<BackendPlanExercise>('PUT', exercise(planId, planExerciseId), input),

  replaceExercise: (client: BackendClient, planId: string, planExerciseId: string, externalId: string) =>
    client.request<BackendPlanExercise>(
      'PUT',
      `${exercise(planId, planExerciseId)}/replacement`,
      { externalId },
    ),

  // GraphQL liefert IDs als Text, das Backend erwartet Zahlen
  reorderExercises: (client: BackendClient, planId: string, planExerciseIds: string[]) =>
    client.request<BackendPlanExercise[]>('PUT', `${plan(planId)}/exercises/order`, {
      exerciseIds: planExerciseIds.map(Number),
    }),

  removeExercise: (client: BackendClient, planId: string, planExerciseId: string) =>
    client.request<MessageResponse>('DELETE', exercise(planId, planExerciseId)),
};
