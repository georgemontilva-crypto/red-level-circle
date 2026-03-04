/**
 * cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Caché en memoria de tiempo de vida (TTL) para queries frecuentes de lectura.
 *
 * Por qué es necesario:
 *   Con 1.000 usuarios viendo el mismo bracket en tiempo real (polling cada 10s),
 *   el sistema generaría ~100 queries/s idénticas a la DB. Con caché de 5s,
 *   esas 100 queries se reducen a 1 cada 5 segundos.
 *
 * Diseño:
 *   - Caché en memoria (Map) — sin dependencias externas (no requiere Redis).
 *   - TTL configurable por clave.
 *   - Invalidación manual para escrituras (ej: al registrar un resultado).
 *   - Limpieza automática de entradas expiradas cada 60s.
 *   - Métricas de hits/misses para monitoreo.
 *
 * TTLs recomendados:
 *   bracket / matches    → 5s  (se actualiza al registrar resultado de mapa)
 *   torneo (detalle)     → 10s (cambia poco durante el torneo)
 *   rankings             → 10s (se actualiza al finalizar serie)
 *   lista de torneos     → 30s (cambia poco)
 *   apuestas abiertas    → 5s  (crítico para UX de apuestas)
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: string;
}

// ─── Implementación ───────────────────────────────────────────────────────────

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  /**
   * Obtiene un valor del caché. Retorna null si no existe o expiró.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data as T;
  }

  /**
   * Guarda un valor en el caché con TTL en milisegundos.
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  /**
   * Invalida una clave específica.
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalida todas las claves que empiecen con un prefijo.
   * Útil para invalidar todas las claves de un torneo: invalidatePrefix("bracket:5:")
   */
  invalidatePrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Limpia todas las entradas expiradas del caché.
   * Se llama automáticamente cada 60s.
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[Cache] Limpieza: ${cleaned} entradas expiradas eliminadas | tamaño actual: ${this.store.size}`);
    }
  }

  /**
   * Retorna métricas del caché para monitoreo.
   */
  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : "0%",
    };
  }

  /**
   * Vacía completamente el caché (útil en tests).
   */
  flush(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// ─── Instancia global ─────────────────────────────────────────────────────────

export const cache = new MemoryCache();

// Limpieza automática cada 60 segundos
setInterval(() => cache.cleanup(), 60_000).unref();

// ─── TTLs estándar (en milisegundos) ─────────────────────────────────────────

export const TTL = {
  BRACKET: 5_000,       // 5s — matches y bracket del torneo
  TOURNAMENT: 10_000,   // 10s — detalle de un torneo
  RANKINGS: 10_000,     // 10s — rankings del torneo
  TOURNAMENTS_LIST: 30_000, // 30s — lista pública de torneos
  BETS_STATUS: 5_000,   // 5s — estado de apuestas de un match
  TEAMS: 30_000,        // 30s — datos de equipos
  USER_PROFILE: 15_000, // 15s — perfil de usuario
} as const;

// ─── Helpers de clave ─────────────────────────────────────────────────────────

export const CacheKey = {
  bracket: (tournamentId: number) => `bracket:${tournamentId}`,
  tournament: (id: number) => `tournament:${id}`,
  rankings: (tournamentId: number) => `rankings:${tournamentId}`,
  tournamentsList: (page = 0) => `tournaments:list:${page}`,
  betsStatus: (matchId: number) => `bets:status:${matchId}`,
  team: (id: number) => `team:${id}`,
  userProfile: (userId: number) => `user:${userId}`,
};

// ─── withCache: wrapper genérico ─────────────────────────────────────────────

/**
 * Ejecuta una función y cachea su resultado.
 * Si el resultado ya está en caché, lo retorna sin ejecutar la función.
 *
 * @example
 * const matches = await withCache(
 *   CacheKey.bracket(tournamentId),
 *   TTL.BRACKET,
 *   () => getMatchesByTournament(tournamentId)
 * );
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}
