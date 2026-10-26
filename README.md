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

## Konfiguration

Alle Einstellungen kommen aus Umgebungsvariablen (siehe `.env.example`):

| Variable | Bedeutung | Standard |
|---|---|---|
| `PORT` | Port des Gateways (Heroku setzt ihn selbst) | `4000` |
| `BACKEND_BASE_URL` | Basis-URL des Spring-Backends | `http://localhost:8080/api/v1` |
| `CORS_ORIGINS` | erlaubte Frontend-Adressen, kommagetrennt | `localhost` auf 4200, 5500, 8000 |
| `CACHE_TTL_SECONDS` | Lebensdauer des Katalog-Caches | `300` |

## Deployment (Heroku)

Das `Procfile` startet `node dist/index.js`. Heroku führt beim Deploy `npm install` und `npm run build` aus.

```
heroku create <gateway-app-name>
heroku config:set BACKEND_BASE_URL=https://trainingsplan-backend-6a384026392a.herokuapp.com/api/v1
heroku config:set CORS_ORIGINS=https://trainingsplan-frontend-be8f5157e428.herokuapp.com
git push heroku main
```

Danach die Adresse `https://<gateway-app-name>.herokuapp.com/graphql` im Frontend in
`angular/src/app/config.ts` eintragen. Beispiel-Anfragen: [docs/beispiel-queries.md](docs/beispiel-queries.md).

## Performance

- **DataLoader** (`src/loaders/planLoaders.ts`): Bei `plans { exercises }` würde sonst pro Plan ein Backend-Aufruf
  entstehen (N+1). Die Loader fassen mehrere Pläne zu einem Aufruf von `GET /users/me/export` zusammen und
  fragen dieselben Daten innerhalb einer Anfrage nur einmal ab. Sie leben pro Anfrage, es gibt keine Nutzerdaten
  im geteilten Speicher.
- **TTL-Cache** (`src/cache/ttlCache.ts`): Muskeln, Körperregionen und Übungsdetails sind für alle Nutzer gleich
  und werden `CACHE_TTL_SECONDS` lang zwischengespeichert. Nutzerdaten werden nie gecacht. Cache-Treffer
  setzen einen Token im Header voraus, prüfen ihn aber nicht gegen das Backend.

## Fehlercodes

Fehler des Backends kommen als GraphQL-Fehler mit `extensions.code` an:

| Backend-Status | `extensions.code` |
|---|---|
| 400 | `BAD_USER_INPUT` |
| 401 | `UNAUTHENTICATED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 502, Backend nicht erreichbar, Timeout | `UPSTREAM_UNAVAILABLE` |
| sonstige 5xx | `INTERNAL_SERVER_ERROR` |
