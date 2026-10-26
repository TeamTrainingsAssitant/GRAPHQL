import { exerciseApi, type ExerciseFilter } from '../../clients/exerciseApi.js';
import { requireToken, type GraphQLContext } from '../../context.js';

// Katalogdaten sind für alle Nutzer gleich und ändern sich selten, deshalb werden sie zwischengespeichert.
// Der Cache prüft den Token nicht. Damit er die Anmeldung nicht umgeht, verlangen wir vorher wenigstens einen.
function cached<T>(context: GraphQLContext, key: string, load: () => Promise<T>): Promise<T> {
  requireToken(context);
  return context.cache.wrap(key, load) as Promise<T>;
}

export const exerciseResolvers = {
  Query: {
    searchExercises: (
      _parent: unknown,
      args: { name: string; limit: number },
      { backend }: GraphQLContext,
    ) => exerciseApi.search(backend, args.name, args.limit),

    exercises: (_parent: unknown, args: ExerciseFilter, { backend }: GraphQLContext) =>
      exerciseApi.list(backend, args),

    exercise: (_parent: unknown, args: { externalId: string }, context: GraphQLContext) =>
      cached(context, `exercise:${args.externalId}`, () =>
        exerciseApi.get(context.backend, args.externalId),
      ),

    muscles: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      cached(context, 'muscles', () => exerciseApi.muscles(context.backend)),

    bodyParts: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      cached(context, 'bodyParts', () => exerciseApi.bodyParts(context.backend)),
  },
};
