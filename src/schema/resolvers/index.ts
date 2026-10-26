import { authResolvers } from './auth.js';
import { planResolvers } from './plan.js';
import { userResolvers } from './user.js';

export const resolvers = {
  Query: {
    health: () => ({ status: 'ok', time: new Date().toISOString() }),
    ...userResolvers.Query,
    ...planResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...planResolvers.Mutation,
  },
  Plan: planResolvers.Plan,
};
