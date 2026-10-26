import { exerciseApi, type ExerciseFilter } from '../../clients/exerciseApi.js';
import type { GraphQLContext } from '../../context.js';

export const exerciseResolvers = {
  Query: {
    searchExercises: (
      _parent: unknown,
      args: { name: string; limit: number },
      { backend }: GraphQLContext,
    ) => exerciseApi.search(backend, args.name, args.limit),

    exercises: (_parent: unknown, args: ExerciseFilter, { backend }: GraphQLContext) =>
      exerciseApi.list(backend, args),

    exercise: (_parent: unknown, args: { externalId: string }, { backend }: GraphQLContext) =>
      exerciseApi.get(backend, args.externalId),

    muscles: (_parent: unknown, _args: unknown, { backend }: GraphQLContext) =>
      exerciseApi.muscles(backend),

    bodyParts: (_parent: unknown, _args: unknown, { backend }: GraphQLContext) =>
      exerciseApi.bodyParts(backend),
  },
};
