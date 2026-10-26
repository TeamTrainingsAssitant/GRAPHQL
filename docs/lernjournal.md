# Lernjournal GraphQL-Gateway (Material für das Portfolio)

Dies ist Rohmaterial für das Kapitel "Implementierung" und die Reflexion. Das Portfolio soll Lernen, Fehler und
Entscheidungen beschreiben, nicht das fertige Produkt. Die Abschnitte "Eure Einschätzung" müsst ihr selbst füllen,
sie lassen sich nicht aus dem Code ableiten. Sie sind mit **TODO** markiert.

## Hilfsmittel

Das Gateway wurde mit Unterstützung von Claude Code geplant und programmiert, in Phasen mit je einem Commit
(Commits von uns geprüft und selbst gesetzt). **TODO:** Ergänzt, was ihr selbst verstanden, geändert oder
verworfen habt, und klärt mit dem Dozenten, wie KI-Unterstützung im Portfolio zu kennzeichnen ist.

## Verlauf nach Phasen

| Phase | Inhalt | Wichtigste Erkenntnis |
|---|---|---|
| 1 | Projektgerüst (Node, TypeScript, Lint) | Schema, Resolver und Konfiguration trennen sich sauber in Ordner. |
| 2 | Yoga-Server, `health`, CORS | App und Serverstart zu trennen macht Tests ohne Port möglich. |
| 3 | Backend-Client, Fehler-Mapping, Token-Kontext | GraphQL meldet Fehler mit HTTP 200. Statuscodes des Backends werden zu `extensions.code`. |
| 4 | Auth und User | Zustandslosigkeit: das Gateway reicht den Token nur durch und speichert nichts. |
| 5 | Pläne und Übungen | Das Backend liefert `Plan` je Endpunkt mit unterschiedlichen Feldern. Feld-Resolver gleichen das aus. |
| 6 | ExerciseDB-Katalog | Nicht jeder Endpunkt liefert alle Felder, daher ein `Exercise`-Typ mit optionalen Feldern. |
| 7 | DataLoader und TTL-Cache | N+1 lässt sich hier über `GET /users/me/export` mit einem Aufruf lösen. |
| 8 | Angular-Anbindung | `PlanService` behält seine Schnittstelle, nur die Quelle wechselt. Das Dashboard blieb unverändert. |
| 9 | Deployment und Doku | siehe unten |

## Entscheidungen und Begründung

1. **Eigenes Gateway (Node/TypeScript, GraphQL Yoga) statt Spring GraphQL im Backend.**
   Für: eigene deploybare Komponente (composable/MACH, kein Monolith), REST bleibt für den Vergleich unverändert,
   gleiche Sprache wie das Angular-Frontend. Dagegen: ein zusätzlicher HTTP-Hop, Fehler müssen zurückübersetzt werden,
   eine weitere Sprache im Projekt. **TODO:** War die Entscheidung im Rückblick richtig?
2. **Token durchreichen statt Session im Gateway.** Hält das Gateway zustandslos (Kriterium im API-Design).
3. **DataLoader mit Export-Endpunkt.** Das Backend hat keinen Batch-Endpunkt für Übungen mehrerer Pläne. Der
   Export liefert alle Pläne samt Übungen. Bei einem einzelnen Plan wird weiter der Einzelabruf genutzt, weil der
   Export dann unnötig groß wäre. Grenze: wächst die Zahl der Pläne stark, wird der Export teuer.
4. **Cache nur für Katalogdaten.** Muskeln, Körperregionen und Übungsdetails sind für alle gleich. Nutzerdaten
   werden nie geteilt. Bekannte Schwäche: Ein Cache-Treffer prüft den Token nicht gegen das Backend. Es wird nur
   verlangt, dass ein Token gesendet wird. Alternative wäre ein `GET /users/me` pro Anfrage (sicherer, aber ein
   Aufruf mehr).
5. **Umfang im Frontend begrenzt auf Pläne und Übungen.** Login, Registrierung und Logout bleiben REST. Das
   hält den Umbau klein und macht den REST-GraphQL-Vergleich im Portfolio möglich.

## Probleme und Einschränkungen (ehrlich festhalten)

- **Kein Node auf dem Entwicklungsrechner** (Firmenrechner ohne Installationsrechte). Dadurch wurde während der
  Entwicklung weder gebaut noch getestet. Die Tests wurden geschrieben, aber nicht ausgeführt. Das ist das größte
  Risiko im Projekt. **TODO:** Tragt ein, wann und wo (z. B. Privatrechner, CI) die Tests zum ersten Mal liefen und
  welche Fehler dabei auftraten.
- `PlanExercise`-Update ersetzt, statt zu ändern (REST-Verhalten): nicht gesendete Felder werden zu `null`.
- `listExercises` im Frontend braucht über `plan(id)` einen Backend-Aufruf mehr als REST. Ein eigener Query
  `planExercises` würde das beheben.
- Der Katalog im Backend braucht nach einem Start etwa zwei Minuten und antwortet bis dahin mit 502.
- Das deployte Frontend benötigt die Gateway-Adresse in `config.ts` und deren Eintrag in `CORS_ORIGINS`.

## Ausblick: Was würden wir wieder und was anders machen?

**TODO** (eure Einschätzung). Anhaltspunkte aus dem Verlauf:

- Die Aufteilung in kleine Phasen mit je einem Commit hat Änderungen nachvollziehbar gehalten.
- Node frühzeitig auf irgendeinem Rechner oder in einer CI (GitHub Actions) verfügbar machen, damit Tests von
  Anfang an laufen.
- Das Backend um einen Batch-Endpunkt oder einen Query `planExercises` ergänzen.
- GraphQL-Schema vor dem Programmieren mit dem API-Design-Dokument abgleichen.

## Reflexion pro Teammitglied

**TODO:** 1 bis 2 Seiten je Person (siehe Vorgabe: strukturiert gearbeitet? Stärken und Schwächen? Was anders machen?
Was Studenten des nächsten Jahres empfehlen?).
