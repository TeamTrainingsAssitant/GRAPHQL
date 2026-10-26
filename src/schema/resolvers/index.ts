import { authResolvers } from './auth.js';
import { userResolvers } from './user.js';

export const resolvers = {
  Query: {
    health: () => ({ status: 'ok', time: new Date().toISOString() }),
    ...userResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
  },
};
