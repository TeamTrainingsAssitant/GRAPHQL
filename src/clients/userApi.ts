import type { BackendClient } from './backendClient.js';

// Antwortformen des Backends (siehe BackEnd/.../controller/dto)
export interface BackendUser {
  userId: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface BackendPlanExercise {
  id: number;
  externalId: string;
  name: string;
  gifUrl: string | null;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  trainingSets: { weight: number | null; reps: number | null; completed: boolean }[];
  position: number;
  note: string | null;
  weight: number | null;
  sets: number | null;
  reps: number | null;
}

export interface BackendUserExport {
  user: BackendUser;
  plans: {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    exercises: BackendPlanExercise[];
  }[];
}

interface MessageResponse {
  message: string;
}

export const userApi = {
  register: (client: BackendClient, input: { username: string; email: string; password: string }) =>
    client.request<MessageResponse & { userId: number }>('POST', '/users', input),

  login: (client: BackendClient, input: { email: string; password: string }) =>
    client.request<MessageResponse & { token: string }>('POST', '/auth', input),

  // Das Backend erwartet den Token beim Abmelden im Body
  logout: (client: BackendClient, token: string) =>
    client.request<MessageResponse>('DELETE', '/auth', { token }),

  me: (client: BackendClient) => client.request<BackendUser>('GET', '/users/me'),

  exportMyData: (client: BackendClient) =>
    client.request<BackendUserExport>('GET', '/users/me/export'),

  deleteAccount: (client: BackendClient, password: string) =>
    client.request<MessageResponse>('DELETE', '/users/me', { password }),
};
