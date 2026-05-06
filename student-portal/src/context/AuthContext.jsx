import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as loginApi, signup as signupApi } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('spartan_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('spartan_token');
    localStorage.removeItem('consent_given');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('spartan:unauthorized', onUnauthorized);
    return () => window.removeEventListener('spartan:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await getMe();
        setUser(response.data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [token]);

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const jwt = response.data?.token;
    const account = response.data?.user;
    localStorage.setItem('spartan_token', jwt);
    setToken(jwt);
    setUser(account);
    return response;
  };

  const signup = async (payload) => {
    const response = await signupApi(payload);
    const jwt = response.data?.token;
    const account = response.data?.user;
    localStorage.setItem('spartan_token', jwt);
    setToken(jwt);
    setUser(account);
    return response;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
