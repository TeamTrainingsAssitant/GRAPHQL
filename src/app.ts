import { createYoga } from 'graphql-yoga';
import { config } from './config.js';
import { schema } from './schema/index.js';

// Baut die Yoga-Instanz getrennt vom Start des HTTP-Servers, damit Tests sie ohne Port nutzen können.
export function createApp() {
  return createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  });
}
