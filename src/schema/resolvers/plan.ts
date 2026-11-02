import {
  planApi,
  type AddExerciseInput,
  type BackendPlan,
  type ExerciseTrainingInput,
  type PlanInput,
} from '../../clients/planApi.js';
import type { GraphQLContext } from '../../context.js';
import type { BackendPlanExercise } from '../../clients/userApi.js';

type Parent = unknown;

export const planResolvers = {
  Query: {
    plans: (_parent: Parent, _args: unknown, { backend }: GraphQLContext) => planApi.list(backend),

    plan: (_parent: Parent, args: { id: string }, { backend }: GraphQLContext) =>
      planApi.get(backend, args.id),

    alternativesForPlanExercise: (
      _parent: Parent,
      args: { planId: string; planExerciseId: string; limit: number },
      { backend }: GraphQLContext,
    ) => planApi.alternatives(backend, args.planId, args.planExerciseId, args.limit),
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
    ) => {
      return planApi.updateExercise(backend, args.planId, args.planExerciseId, args.input);
    },

    removePlanExercise: (
      _parent: Parent,
      args: { planId: string; planExerciseId: string },
      { backend }: GraphQLContext,
    ) => planApi.removeExercise(backend, args.planId, args.planExerciseId),

    reorderPlanExercises: (
      _parent: Parent,
      args: { planId: string; planExerciseIds: string[] },
      { backend }: GraphQLContext,
    ) => planApi.reorderExercises(backend, args.planId, args.planExerciseIds),

    replacePlanExercise: (
      _parent: Parent,
      args: { planId: string; planExerciseId: string; externalId: string },
      { backend }: GraphQLContext,
    ) => planApi.replaceExercise(backend, args.planId, args.planExerciseId, args.externalId),
  },

  // Feld-Resolver: Felder, die das Backend je nach Endpunkt nicht mitliefert, werden nachgeladen.
  // Das läuft über die DataLoader, die mehrere Pläne in einem Backend-Aufruf zusammenfassen.
  Plan: {
    exercises: (parent: BackendPlan, _args: unknown, { loaders }: GraphQLContext) =>
      loaders.exercisesByPlan.load(String(parent.id)),

    exerciseCount: async (parent: BackendPlan, _args: unknown, { loaders }: GraphQLContext) =>
      parent.exerciseCount ?? (await loaders.exercisesByPlan.load(String(parent.id))).length,

    createdAt: async (parent: BackendPlan, _args: unknown, { loaders }: GraphQLContext) =>
      parent.createdAt ?? (await loaders.planById.load(String(parent.id))).createdAt,
  },

  PlanExercise: {
    trainingSets: (parent: BackendPlanExercise) => parent.trainingSets ?? [],
  },
};
