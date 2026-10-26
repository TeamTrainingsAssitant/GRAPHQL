import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/cache/ttlCache.js';

function cacheWithClock(options: { ttlMs: number; maxEntries?: number }) {
  let time = 0;
  const cache = new TtlCache<string>({ ...options, now: () => time });
  return { cache, advance: (ms: number) => (time += ms) };
}

describe('TtlCache', () => {
  it('liefert gespeicherte Werte bis zum Ablauf der TTL', () => {
    const { cache, advance } = cacheWithClock({ ttlMs: 1000 });
    cache.set('a', 'x');

    advance(999);
    expect(cache.get('a')).toBe('x');

    advance(1);
    expect(cache.get('a')).toBeUndefined();
  });

  it('wrap ruft load nur beim ersten Mal auf', async () => {
    const { cache } = cacheWithClock({ ttlMs: 1000 });
    const load = vi.fn().mockResolvedValue('x');

    expect(await cache.wrap('a', load)).toBe('x');
    expect(await cache.wrap('a', load)).toBe('x');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('wrap lädt nach Ablauf der TTL neu', async () => {
    const { cache, advance } = cacheWithClock({ ttlMs: 1000 });
    const load = vi.fn().mockResolvedValueOnce('alt').mockResolvedValueOnce('neu');

    await cache.wrap('a', load);
    advance(1000);

    expect(await cache.wrap('a', load)).toBe('neu');
  });

  it('gleichzeitige wrap-Aufrufe teilen sich einen load', async () => {
    const { cache } = cacheWithClock({ ttlMs: 1000 });
    const load = vi.fn().mockResolvedValue('x');

    await Promise.all([cache.wrap('a', load), cache.wrap('a', load)]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('speichert Fehler nicht', async () => {
    const { cache } = cacheWithClock({ ttlMs: 1000 });
    const load = vi.fn().mockRejectedValueOnce(new Error('502')).mockResolvedValueOnce('x');

    await expect(cache.wrap('a', load)).rejects.toThrow('502');
    expect(await cache.wrap('a', load)).toBe('x');
  });

  it('wirft bei Überschreitung von maxEntries den ältesten Eintrag raus', () => {
    const { cache } = cacheWithClock({ ttlMs: 1000, maxEntries: 2 });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });
});
