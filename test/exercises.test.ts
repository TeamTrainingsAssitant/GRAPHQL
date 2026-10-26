import { graphql } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/cache/ttlCache.js';
import { buildContext } from '../src/context.js';
import { schema } from '../src/schema/index.js';

function run(
  source: string,
  backendResult: unknown,
  cache = new TtlCache<unknown>({ ttlMs: 60_000 }),
  token: string | undefined = 'tok',
) {
  const request = vi.fn().mockResolvedValue(backendResult);
  const contextValue = buildContext(token, { request }, cache);
  return graphql({ schema, source, contextValue }).then((result) => ({ result, request }));
}

const squat = {
  externalId: 'abc',
  name: 'Squat',
  gifUrl: 'https://example.org/squat.gif',
  primaryMuscleGroups: ['quads'],
  secondaryMuscleGroups: ['glutes'],
  bodyParts: ['upper legs'],
  equipments: ['barbell'],
  instructions: ['Stand up.', 'Go down.'],
};

describe('ExerciseDB-Katalog', () => {
  it('searchExercises nutzt GET /exercises mit Standardwerten', async () => {
    const { result, request } = await run('{ searchExercises { name } }', [squat]);

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ searchExercises: [{ name: 'Squat' }] });
    expect(request).toHaveBeenCalledWith('GET', '/exercises?limit=20');
  });

  it('searchExercises gibt Name und Limit weiter', async () => {
    const { request } = await run('{ searchExercises(name: "bench press", limit: 5) { name } }', []);

    expect(request).toHaveBeenCalledWith('GET', '/exercises?name=bench+press&limit=5');
  });

  it('exercises gibt Filter und Paginierung kommagetrennt weiter', async () => {
    const { result, request } = await run(
      '{ exercises(name: "sq", muscles: ["quads", "glutes"], offset: 20, limit: 10) { total exercises { name bodyParts } } }',
      { total: 31, exercises: [squat] },
    );

    expect(result.data).toEqual({
      exercises: { total: 31, exercises: [{ name: 'Squat', bodyParts: ['upper legs'] }] },
    });
    expect(request).toHaveBeenCalledWith(
      'GET',
      '/exercisedb/exercises?name=sq&muscles=quads%2Cglutes&offset=20&limit=10',
    );
  });

  it('exercise liefert die Anleitung und maskiert die ID im Pfad', async () => {
    const { result, request } = await run('{ exercise(externalId: "a/b") { instructions } }', squat);

    expect(result.data).toEqual({ exercise: { instructions: ['Stand up.', 'Go down.'] } });
    expect(request).toHaveBeenCalledWith('GET', '/exercisedb/exercises/a%2Fb');
  });

  it('muscles kommt beim zweiten Aufruf aus dem Cache', async () => {
    const cache = new TtlCache<unknown>({ ttlMs: 60_000 });

    const first = await run('{ muscles }', ['quads'], cache);
    const second = await run('{ muscles }', ['andere'], cache);

    expect(first.request).toHaveBeenCalledTimes(1);
    expect(second.request).not.toHaveBeenCalled();
    expect(second.result.data).toEqual({ muscles: ['quads'] });
  });

  it('Katalogdaten aus dem Cache gibt es nicht ohne Token', async () => {
    const cache = new TtlCache<unknown>({ ttlMs: 60_000 });
    await run('{ muscles }', ['quads'], cache);

    const { result, request } = await run('{ muscles }', ['quads'], cache, undefined);

    expect(result.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(request).not.toHaveBeenCalled();
  });

  it('muscles und bodyParts liefern Listen', async () => {
    const muscles = await run('{ muscles }', ['quads', 'glutes']);
    const bodyParts = await run('{ bodyParts }', ['upper legs']);

    expect(muscles.result.data).toEqual({ muscles: ['quads', 'glutes'] });
    expect(muscles.request).toHaveBeenCalledWith('GET', '/exercisedb/muscles');
    expect(bodyParts.result.data).toEqual({ bodyParts: ['upper legs'] });
    expect(bodyParts.request).toHaveBeenCalledWith('GET', '/exercisedb/bodyparts');
  });
});
