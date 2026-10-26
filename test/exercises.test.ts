import { graphql } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { GraphQLContext } from '../src/context.js';
import { schema } from '../src/schema/index.js';

function run(source: string, backendResult: unknown) {
  const request = vi.fn().mockResolvedValue(backendResult);
  const contextValue: GraphQLContext = { token: 'tok', backend: { request } };
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

  it('muscles und bodyParts liefern Listen', async () => {
    const muscles = await run('{ muscles }', ['quads', 'glutes']);
    const bodyParts = await run('{ bodyParts }', ['upper legs']);

    expect(muscles.result.data).toEqual({ muscles: ['quads', 'glutes'] });
    expect(muscles.request).toHaveBeenCalledWith('GET', '/exercisedb/muscles');
    expect(bodyParts.result.data).toEqual({ bodyParts: ['upper legs'] });
    expect(bodyParts.request).toHaveBeenCalledWith('GET', '/exercisedb/bodyparts');
  });
});
