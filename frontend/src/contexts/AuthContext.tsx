import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthenticatedUser } from '../types';
import { authService, RegisterClinicPayload, RegisterStaffPayload } from '../services/auth.service';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerClinic: (payload: RegisterClinicPayload) => Promise<void>;
  registerStaff: (payload: RegisterStaffPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getStoredUser());
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
  }

  // Cada fluxo de cadastro já loga automaticamente ao final (a API
  // devolve token igual ao login) — não precisa de uma etapa separada
  // de "cadastrou, agora faça login".
  async function registerClinic(payload: RegisterClinicPayload) {
    const loggedUser = await authService.registerClinic(payload);
    setUser(loggedUser);
  }

  async function registerStaff(payload: RegisterStaffPayload) {
    const loggedUser = await authService.registerStaff(payload);
    setUser(loggedUser);
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, registerClinic, registerStaff, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
