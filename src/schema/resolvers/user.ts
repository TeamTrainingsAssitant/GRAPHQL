import { userApi } from '../../clients/userApi.js';
import type { GraphQLContext } from '../../context.js';

export const userResolvers = {
  Query: {
    me: (_parent: unknown, _args: unknown, { backend }: GraphQLContext) => userApi.me(backend),

    exportMyData: (_parent: unknown, _args: unknown, { backend }: GraphQLContext) =>
      userApi.exportMyData(backend),
  },
  Mutation: {
    deleteAccount: (
      _parent: unknown,
      args: { password: string },
      { backend }: GraphQLContext,
    ) => userApi.deleteAccount(backend, args.password),
  },
};
