interface Entry<T> {
  value: T;
  expiresAt: number;
}

export interface TtlCacheOptions {
  ttlMs: number;
  // Obergrenze, damit der Cache nicht unbegrenzt wächst. Bei Überschreitung fliegt der älteste Eintrag raus.
  maxEntries?: number;
  // austauschbar für Tests
  now?: () => number;
}

// Einfacher Cache auf Basis einer Map: Einträge laufen nach ttlMs ab.
// Gleichzeitige Anfragen auf denselben Schlüssel teilen sich einen Backend-Aufruf.
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor({ ttlMs, maxEntries = 5000, now = Date.now }: TtlCacheOptions) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.now = now;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.delete(key); // damit der Eintrag in der Einfügereihenfolge ganz hinten landet
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }

  // Liefert den Cache-Wert oder ruft load() auf. Fehler werden nicht gespeichert.
  async wrap(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const running = this.inFlight.get(key);
    if (running) return running;

    const promise = load()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.entries.clear();
  }
}
