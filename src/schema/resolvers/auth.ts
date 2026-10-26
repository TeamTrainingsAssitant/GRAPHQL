import { userApi } from '../../clients/userApi.js';
import { requireToken, type GraphQLContext } from '../../context.js';

export const authResolvers = {
  Mutation: {
    register: (
      _parent: unknown,
      args: { input: { username: string; email: string; password: string } },
      { backend }: GraphQLContext,
    ) => userApi.register(backend, args.input),

    login: (
      _parent: unknown,
      args: { input: { email: string; password: string } },
      { backend }: GraphQLContext,
    ) => userApi.login(backend, args.input),

    logout: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      userApi.logout(context.backend, requireToken(context)),
  },
};
