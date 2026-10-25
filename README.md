# GRAPHQL – Gateway für den TrainingsPlanAssistant

GraphQL-Gateway (Backend-for-Frontend) zwischen der Angular-SPA und dem Spring-Backend.
Das Gateway hat keine eigene Datenbank und keine Session. Es nimmt GraphQL-Anfragen entgegen,
ruft das bestehende REST-API des Backends auf und gibt die Antwort in der angefragten Form zurück.

```
Angular-SPA ──GraphQL──▶ Gateway (dieses Repo) ──REST──▶ Spring-Backend ──▶ PostgreSQL
                                                    └──────▶ ExerciseDB (über das Backend)
```

- Der Bearer-Token des Frontends wird bei jeder Anfrage an das Backend durchgereicht (zustandslos).
- Das REST-API des Backends bleibt unverändert bestehen. So lassen sich REST und GraphQL vergleichen.

## Stack

Node.js (>= 22), TypeScript, GraphQL Yoga, DataLoader, Vitest, ESLint, Prettier.

## Ordnerstruktur

```
src/
  index.ts              Server-Start
  config.ts             Umgebungsvariablen
  schema/               GraphQL-Schema (SDL) und Resolver
  clients/              Aufrufe des Backend-REST-APIs
  cache/                Cache im Gateway
  loaders/              DataLoader (Batching gegen N+1)
  errors/               Übersetzung von Backend-Fehlern in GraphQL-Fehler
test/                   Tests
```

## Lokal starten

```
npm install
cp .env.example .env
npm run dev
```

Danach läuft GraphQL (mit GraphiQL im Browser) unter http://localhost:4000/graphql.
Test-Anfrage: `{ health { status time } }`. Tests: `npm test`.
