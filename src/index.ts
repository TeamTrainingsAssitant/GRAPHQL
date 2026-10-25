// dotenv muss vor config.ts geladen werden, damit .env gelesen ist (ESM wertet Imports der Reihe nach aus)
import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';

const server = createServer(createApp());

server.listen(config.port, () => {
  console.log(`GraphQL-Gateway läuft auf http://localhost:${config.port}/graphql`);
});
