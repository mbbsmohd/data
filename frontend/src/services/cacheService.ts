/**
 * Client-Side Persistent Cache & Offline Resiliency Service
 * Handles safe caching of non-sensitive catalogues, offline detection, and session cleanup.
 */

const PREFIX = 'bds_cache_';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

export class CacheService {
  private static version = '1.0.0';

  /**
   * Set item in persistent local cache with expiration
   */
  static set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
        version: this.version
      };
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // Storage full or private mode fallback
    }
  }

  /**
   * Get item from persistent local cache if not expired
   */
  static get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Invalidate specific cached key
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // Ignore
    }
  }

  /**
   * Session / Logout Cleanup:
   * Strictly clears any cached data to prevent cross-account data leakage on shared devices.
   */
  static clearOnLogout(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(PREFIX) || k.startsWith('bds_') || k.startsWith('abk_'))) {
          // Keep non-sensitive settings cache if appropriate, or wipe clean
          if (k !== PREFIX + 'public_settings') {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }

  /**
   * Register Service Worker
   */
  static registerServiceWorker(): void {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ [PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('⚠️ [PWA] Service Worker registration failed:', error);
          });
      });
    }
  }
}
