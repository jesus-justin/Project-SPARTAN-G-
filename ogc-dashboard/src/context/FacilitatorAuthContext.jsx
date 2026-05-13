import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { facilitatorLogin, getMe } from '../api/ogc.api';

const FacilitatorAuthContext = createContext(null);

export function FacilitatorAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ogc_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('ogc_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('ogc:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ogc:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        const account = response.data;

        if (account?.role !== 'facilitator') {
          logout();
          return;
        }

        setUser(account);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [token]);

  const login = async ({ email, password }) => {
    const response = await facilitatorLogin({ email, password });
    const jwt = response.data?.token;
    const account = response.data?.user;

    if (account?.role !== 'facilitator') {
      throw new Error('Facilitator access only');
    }

    localStorage.setItem('ogc_token', jwt);
    setToken(jwt);
    setUser(account);
    return response;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user?.role === 'facilitator'),
      login,
      logout,
    }),
    [token, user, loading]
  );

  return <FacilitatorAuthContext.Provider value={value}>{children}</FacilitatorAuthContext.Provider>;
}

export function useFacilitatorAuth() {
  const context = useContext(FacilitatorAuthContext);
  if (!context) {
    throw new Error('useFacilitatorAuth must be used within FacilitatorAuthProvider');
  }
  return context;
}
