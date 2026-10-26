import { graphql } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { buildContext } from '../src/context.js';
import { schema } from '../src/schema/index.js';

// Attrappe: antwortet je nach "METHOD /pfad" mit vorbereiteten Daten
function run(source: string, responses: Record<string, unknown>, token = 'tok') {
  const request = vi.fn(async (method: string, path: string) => {
    const key = `${method} ${path}`;
    if (!(key in responses)) throw new Error(`Unerwarteter Backend-Aufruf: ${key}`);
    return responses[key];
  });
  const contextValue = buildContext(token, { request });
  return graphql({ schema, source, contextValue }).then((result) => ({ result, request }));
}

const listItem = { id: 1, name: 'Push', description: null, updatedAt: '2026-10-26T10:00:00', exerciseCount: 2 };
const detail = { id: 1, name: 'Push', description: null, createdAt: '2026-10-20T09:00:00', updatedAt: '2026-10-26T10:00:00' };
const bench = {
  id: 9, externalId: 'x1', name: 'Bench Press', gifUrl: null,
  primaryMuscleGroups: ['chest'], secondaryMuscleGroups: [], position: 0,
  note: null, weight: 60, sets: 3, reps: 10,
};

describe('Pläne lesen', () => {
  it('plans nutzt nur GET /plans, wenn nur Listenfelder angefragt werden', async () => {
    const { result, request } = await run('{ plans { id name exerciseCount } }', { 'GET /plans': [listItem] });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ plans: [{ id: '1', name: 'Push', exerciseCount: 2 }] });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('plans { exercises } lädt die Übungen pro Plan nach', async () => {
    const { result } = await run('{ plans { name exercises { name sets reps } } }', {
      'GET /plans': [listItem],
      'GET /plans/1/exercises': [bench],
    });

    expect(result.data).toEqual({
      plans: [{ name: 'Push', exercises: [{ name: 'Bench Press', sets: 3, reps: 10 }] }],
    });
  });

  it('plan liefert createdAt aus dem Einzelabruf und exerciseCount aus der Übungsliste', async () => {
    const { result } = await run('{ plan(id: "1") { createdAt exerciseCount } }', {
      'GET /plans/1': detail,
      'GET /plans/1/exercises': [bench],
    });

    expect(result.data).toEqual({ plan: { createdAt: '2026-10-20T09:00:00', exerciseCount: 1 } });
  });

  it('plans { createdAt } holt das fehlende Feld per GET /plans/{id}', async () => {
    const { result } = await run('{ plans { createdAt } }', {
      'GET /plans': [listItem],
      'GET /plans/1': detail,
    });

    expect(result.data).toEqual({ plans: [{ createdAt: '2026-10-20T09:00:00' }] });
  });
});

describe('DataLoader', () => {
  const second = { ...listItem, id: 2, name: 'Pull' };
  const exportData = {
    user: { userId: 1, username: 'a', email: 'a@b.de', createdAt: '2026-10-01' },
    plans: [
      { ...detail, exercises: [bench] },
      { ...detail, id: 2, name: 'Pull', createdAt: '2026-10-21T09:00:00', exercises: [] },
    ],
  };

  it('holt die Übungen mehrerer Pläne mit einem einzigen Export-Aufruf', async () => {
    const { result, request } = await run('{ plans { name exercises { name } } }', {
      'GET /plans': [listItem, second],
      'GET /users/me/export': exportData,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      plans: [
        { name: 'Push', exercises: [{ name: 'Bench Press' }] },
        { name: 'Pull', exercises: [] },
      ],
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('teilt sich den Export-Aufruf zwischen exercises und createdAt', async () => {
    const { result, request } = await run('{ plans { createdAt exercises { name } } }', {
      'GET /plans': [listItem, second],
      'GET /users/me/export': exportData,
    });

    expect(result.data).toEqual({
      plans: [
        { createdAt: '2026-10-20T09:00:00', exercises: [{ name: 'Bench Press' }] },
        { createdAt: '2026-10-21T09:00:00', exercises: [] },
      ],
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('fragt exercises und exerciseCount desselben Plans nur einmal ab', async () => {
    const { result, request } = await run('{ plans { exerciseCount exercises { name } } }', {
      'GET /plans': [listItem],
      'GET /plans/1/exercises': [bench],
    });

    expect(result.errors).toBeUndefined();
    expect(request).toHaveBeenCalledTimes(2);
  });
});

describe('Pläne ändern', () => {
  it('createPlan sendet POST /plans', async () => {
    const { result, request } = await run(
      'mutation { createPlan(input: {name: "Push"}) { id name } }',
      { 'POST /plans': detail },
    );

    expect(result.data).toEqual({ createPlan: { id: '1', name: 'Push' } });
    expect(request).toHaveBeenCalledWith('POST', '/plans', { name: 'Push' });
  });

  it('updatePlan sendet PUT /plans/{id}', async () => {
    const { request } = await run(
      'mutation { updatePlan(id: "1", input: {name: "Pull", description: "Rücken"}) { id } }',
      { 'PUT /plans/1': detail },
    );

    expect(request).toHaveBeenCalledWith('PUT', '/plans/1', { name: 'Pull', description: 'Rücken' });
  });

  it('deletePlan sendet DELETE /plans/{id}', async () => {
    const { result } = await run('mutation { deletePlan(id: "1") { message } }', {
      'DELETE /plans/1': { message: 'Plan deleted.' },
    });

    expect(result.data).toEqual({ deletePlan: { message: 'Plan deleted.' } });
  });

  it('addExerciseToPlan sendet POST /plans/{id}/exercises', async () => {
    const { result, request } = await run(
      'mutation { addExerciseToPlan(planId: "1", input: {externalId: "x1", sets: 3, reps: 10}) { id name sets } }',
      { 'POST /plans/1/exercises': bench },
    );

    expect(result.data).toEqual({ addExerciseToPlan: { id: '9', name: 'Bench Press', sets: 3 } });
    expect(request).toHaveBeenCalledWith('POST', '/plans/1/exercises', {
      externalId: 'x1',
      sets: 3,
      reps: 10,
    });
  });

  it('updatePlanExercise sendet nur die angegebenen Felder (Rest wird im Backend entfernt)', async () => {
    const { request } = await run(
      'mutation { updatePlanExercise(planId: "1", planExerciseId: "9", input: {weight: 62.5}) { id } }',
      { 'PUT /plans/1/exercises/9': bench },
    );

    expect(request).toHaveBeenCalledWith('PUT', '/plans/1/exercises/9', { weight: 62.5 });
  });

  it('removePlanExercise sendet DELETE /plans/{id}/exercises/{peId}', async () => {
    const { result } = await run(
      'mutation { removePlanExercise(planId: "1", planExerciseId: "9") { message } }',
      { 'DELETE /plans/1/exercises/9': { message: 'Exercise removed.' } },
    );

    expect(result.data).toEqual({ removePlanExercise: { message: 'Exercise removed.' } });
  });

  it('maskiert IDs im Pfad', async () => {
    const { request } = await run('mutation { deletePlan(id: "1/../users") { message } }', {
      'DELETE /plans/1%2F..%2Fusers': { message: 'Plan deleted.' },
    });

    expect(request).toHaveBeenCalledWith('DELETE', '/plans/1%2F..%2Fusers');
  });
});
