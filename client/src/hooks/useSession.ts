import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'shiftmind_session';

// Shared listeners for cross-component sync
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function notify() {
  listeners.forEach((l) => l());
}

export function useSession() {
  const isLoggedIn = useSyncExternalStore(subscribe, getSnapshot);

  const login = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    notify();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    notify();
  }, []);

  return { isLoggedIn, login, logout };
}
