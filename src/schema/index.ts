import { readFileSync } from 'node:fs';
import { createSchema } from 'graphql-yoga';
import { resolvers } from './resolvers/index.js';

// Die SDL liegt im Quellordner und wird nicht nach dist/ kopiert.
// Der relative Pfad stimmt deshalb sowohl für src/schema/ (dev) als auch für dist/schema/ (start).
const typeDefs = readFileSync(new URL('../../src/schema/schema.graphql', import.meta.url), 'utf-8');

export const schema = createSchema({ typeDefs, resolvers });
