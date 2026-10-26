import {
  planApi,
  type AddExerciseInput,
  type BackendPlan,
  type ExerciseTrainingInput,
  type PlanInput,
} from '../../clients/planApi.js';
import type { GraphQLContext } from '../../context.js';

type Parent = unknown;

export const planResolvers = {
  Query: {
    plans: (_parent: Parent, _args: unknown, { backend }: GraphQLContext) => planApi.list(backend),

    plan: (_parent: Parent, args: { id: string }, { backend }: GraphQLContext) =>
      planApi.get(backend, args.id),
  },

  Mutation: {
    createPlan: (_parent: Parent, args: { input: PlanInput }, { backend }: GraphQLContext) =>
      planApi.create(backend, args.input),

    updatePlan: (
      _parent: Parent,
      args: { id: string; input: PlanInput },
      { backend }: GraphQLContext,
    ) => planApi.update(backend, args.id, args.input),

    deletePlan: (_parent: Parent, args: { id: string }, { backend }: GraphQLContext) =>
      planApi.delete(backend, args.id),

    addExerciseToPlan: (
      _parent: Parent,
      args: { planId: string; input: AddExerciseInput },
      { backend }: GraphQLContext,
    ) => planApi.addExercise(backend, args.planId, args.input),

    updatePlanExercise: (
      _parent: Parent,
      args: { planId: string; planExerciseId: string; input: ExerciseTrainingInput },
      { backend }: GraphQLContext,
    ) => planApi.updateExercise(backend, args.planId, args.planExerciseId, args.input),

    removePlanExercise: (
      _parent: Parent,
      args: { planId: string; planExerciseId: string },
      { backend }: GraphQLContext,
    ) => planApi.removeExercise(backend, args.planId, args.planExerciseId),
  },

  // Feld-Resolver: Felder, die das Backend je nach Endpunkt nicht mitliefert, werden nachgeladen
  Plan: {
    exercises: (parent: BackendPlan, _args: unknown, { backend }: GraphQLContext) =>
      planApi.listExercises(backend, String(parent.id)),

    exerciseCount: async (parent: BackendPlan, _args: unknown, { backend }: GraphQLContext) =>
      parent.exerciseCount ?? (await planApi.listExercises(backend, String(parent.id))).length,

    createdAt: async (parent: BackendPlan, _args: unknown, { backend }: GraphQLContext) =>
      parent.createdAt ?? (await planApi.get(backend, String(parent.id))).createdAt,
  },
};
