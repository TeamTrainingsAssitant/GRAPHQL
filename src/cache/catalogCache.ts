import { config } from '../config.js';
import { TtlCache } from './ttlCache.js';

// Gemeinsamer Cache für Katalogdaten (Muskeln, Körperregionen, Übungsdetails).
// Darf nur Daten enthalten, die für alle Nutzer gleich sind. Nutzerdaten (Pläne usw.) gehören nicht hinein.
export const catalogCache = new TtlCache<unknown>({ ttlMs: config.cacheTtlSeconds * 1000 });
