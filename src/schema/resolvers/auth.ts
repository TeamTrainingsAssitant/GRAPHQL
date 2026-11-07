import { userApi } from '../../clients/userApi.js';
import { requireToken, type GraphQLContext } from '../../context.js';

export const authResolvers = {
  Mutation: {
    register: (
      _parent: unknown,
      args: { input: { username: string; email: string; password: string } },
      { backend }: GraphQLContext,
    ) => userApi.register(backend, args.input),

    login: async (
      _parent: unknown,
      args: { input: { email: string; password: string } },
      context: GraphQLContext,
    ) => {
      const result = await userApi.login(context.backend, args.input);
      return { ...result, token: context.loginSession.token ?? result.token };
    },

    logout: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      userApi.logout(context.backend, requireToken(context)),
  },
};
