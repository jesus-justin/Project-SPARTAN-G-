import { createContext, useContext, useMemo, useState } from 'react';
import { facilitatorLogin } from '../api/ogc.api';

const FacilitatorAuthContext = createContext(null);

export function FacilitatorAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ogc_token'));

  const login = async ({ email, password }) => {
    const response = await facilitatorLogin({ studentId: email, password });
    const jwt = response.data?.token;
    localStorage.setItem('ogc_token', jwt);
    setToken(jwt);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('ogc_token');
    setToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token]
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
