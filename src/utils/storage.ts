export const storage = {
  getJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setJson(key: string, value: unknown) {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota and private mode errors. The UI should keep working in memory.
    }
  },

  getSessionJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;

    try {
      const raw = window.sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setSessionJson(key: string, value: unknown) {
    if (typeof window === 'undefined') return;

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota and private mode errors. The UI should keep working in memory.
    }
  },

  removeSessionItem(key: string) {
    if (typeof window === 'undefined') return;

    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors. The UI should keep working in memory.
    }
  }
};
