import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

// Browser storage is not a security boundary. API authorization validates every request.
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly prefix = environment.demo ? 'plantilla-demo:' : 'plantilla:';
  setItem<T>(key: string, value: T, timeDay?: number): void {
    const expires = timeDay ? Date.now() + timeDay * 86400000 : null;
    try {
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify({ value, expires }),
      );
    } catch {
      /* Private browsing or a full storage quota must not crash the app. */
    }
  }
  getItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const item = JSON.parse(raw);
      if (
        !item ||
        !('value' in item) ||
        (item.expires !== null &&
          (!Number.isFinite(item.expires) || item.expires <= Date.now()))
      ) {
        this.removeItem(key);
        return null;
      }
      return item.value as T;
    } catch {
      this.removeItem(key);
      return null;
    }
  }
  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* Storage unavailable. */
    }
  }
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}
