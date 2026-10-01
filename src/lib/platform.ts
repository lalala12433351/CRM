import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const nativePlatform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';

export const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!API_BASE || !path.startsWith('/api')) return path;
  return `${API_BASE}${path}`;
}

/** Public origin for URLs shown to users (webhooks, share links); the app's own origin is capacitor/localhost. */
export function publicOrigin(): string {
  return 'https://crm.pixbe.in';
}

let fetchPatched = false;

/** Route relative `/api/...` requests to the remote API when running as a bundled app. */
export function installApiFetch(): void {
  if (fetchPatched || !API_BASE || typeof window === 'undefined') return;
  fetchPatched = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') return nativeFetch(apiUrl(input), init);
    if (input instanceof URL) return nativeFetch(input, init);
    if (input instanceof Request) {
      const url = new URL(input.url);
      if (url.origin === window.location.origin && url.pathname.startsWith('/api')) {
        return nativeFetch(new Request(apiUrl(url.pathname + url.search), input), init);
      }
    }
    return nativeFetch(input, init);
  };
}
