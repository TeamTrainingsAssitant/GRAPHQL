import { authResolvers } from './auth.js';
import { exerciseResolvers } from './exercise.js';
import { planResolvers } from './plan.js';
import { userResolvers } from './user.js';

export const resolvers = {
  Query: {
    health: () => ({ status: 'ok', time: new Date().toISOString() }),
    ...userResolvers.Query,
    ...planResolvers.Query,
    ...exerciseResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...planResolvers.Mutation,
  },
  Plan: planResolvers.Plan,
};
