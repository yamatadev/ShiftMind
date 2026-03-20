import { useState, useCallback } from 'react';

const STORAGE_KEY = 'shiftmind_session';

export function useSession() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const login = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
  }, []);

  return { isLoggedIn, login, logout };
}
