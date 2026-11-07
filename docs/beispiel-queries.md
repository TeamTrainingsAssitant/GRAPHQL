# Beispiel-Queries

Endpunkt lokal: `http://localhost:4000/graphql` (im Browser öffnet sich dort GraphiQL).
Variablen und Header stehen in GraphiQL unten im Bereich "Variables" bzw. "Headers".

Bei direktem Zugriff auf das Gateway braucht ihr für geschützte Anfragen den Token aus `login` im Header:

```json
{ "Authorization": "Bearer <token>" }
```

Der Browser-Login über das Frontend läuft ebenfalls über die GraphQL-Mutation. Der Frontend-Proxy speichert das Token als `HttpOnly`-Cookie; JavaScript muss es nicht auslesen oder selbst im Header setzen.

## Anmeldung

```graphql
mutation {
  register(input: { username: "max", email: "max@example.org", password: "12345678" }) {
    message
    userId
  }
}
```

```graphql
mutation {
  login(input: { email: "max@example.org", password: "12345678" }) {
    token
  }
}
```

```graphql
{ me { userId username email createdAt } }
```

## Pläne und Übungen

Plan anlegen:

```graphql
mutation {
  createPlan(input: { name: "Push-Tag" }) {
    id
    name
  }
}
```

Übung suchen und hinzufügen (die `externalId` stammt aus der Suche):

```graphql
{ searchExercises(name: "bench press", limit: 5) { externalId name gifUrl } }
```

```graphql
mutation {
  addExerciseToPlan(planId: "1", input: { externalId: "<externalId>", sets: 3, reps: 10, weight: 60 }) {
    id
    name
    sets
    reps
  }
}
```

Reihenfolge der Übungen ändern (alle Übungs-IDs des Plans in der neuen Reihenfolge):

```graphql
mutation {
  reorderPlanExercises(planId: "1", planExerciseIds: ["12", "7", "9"]) {
    id
    name
    position
  }
}
```

## Der Vorteil gegenüber REST: alles in einer Anfrage

REST braucht dafür `GET /plans` und pro Plan `GET /plans/{id}/exercises`. Hier genügt eine Anfrage, und nur die
angefragten Felder kommen zurück:

```graphql
{
  plans {
    name
    exerciseCount
    exercises { name sets reps weight }
  }
}
```

## Katalog

```graphql
{
  exercises(muscles: ["quads"], limit: 10) {
    total
    exercises { name gifUrl bodyParts equipments }
  }
  muscles
  bodyParts
}
```

## Fehler

Ohne Token:

```graphql
{ me { username } }
```

liefert `errors[0].extensions.code = "UNAUTHENTICATED"`. Weitere Codes stehen in der README.
