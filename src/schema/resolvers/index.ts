export const resolvers = {
  Query: {
    health: () => ({ status: 'ok', time: new Date().toISOString() }),
  },
};
