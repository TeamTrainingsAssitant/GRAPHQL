import { createYoga } from 'graphql-yoga';
import { config } from './config.js';
import { createContext } from './context.js';
import { schema } from './schema/index.js';

// Baut die Yoga-Instanz getrennt vom Start des HTTP-Servers, damit Tests sie ohne Port nutzen können.
export function createApp() {
  return createYoga({
    schema,
    context: createContext,
    graphqlEndpoint: '/graphql',
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  });
}
