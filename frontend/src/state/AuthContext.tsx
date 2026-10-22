import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthSession, LoginPayload, RegisterPayload, User } from '@/types';
import {
  cacheSession,
  clearCachedSession,
  modeLabel,
  resolveBackend,
  type DataMode,
} from '@/services';
import type { NutriCartBackend } from '@/services/contracts';
import { friendlyMessage, toAppError } from '@/utils/errors';

export type AuthStatus = 'booting' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  session: AuthSession | null;
  backend: NutriCartBackend | null;
  mode: DataMode;
  modeLabel: string;
  bootError: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateAccount: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the signed-in identity and the resolved data backend.
 * A refresh restores the session from the cached token, so the user stays
 * signed in; logging out only clears the session and never the account.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<NutriCartBackend | null>(null);
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resolved = await resolveBackend();
        if (cancelled) return;
        setBackend(resolved);
        const existing = resolved.auth.session();
        if (existing?.user) {
          setSession(existing);
          setStatus('authenticated');
        } else {
          setStatus('anonymous');
        }
      } catch (error) {
        if (cancelled) return;
        setBootError(friendlyMessage(error));
        setStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      if (!backend) throw toAppError(new Error('NutriCart is still starting up.'));
      const next = await backend.auth.login(payload);
      cacheSession(next);
      setSession(next);
      setStatus('authenticated');
      return next.user;
    },
    [backend],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (!backend) throw toAppError(new Error('NutriCart is still starting up.'));
      const next = await backend.auth.register(payload);
      cacheSession(next);
      setSession(next);
      setStatus('authenticated');
      return next.user;
    },
    [backend],
  );

  const logout = useCallback(async () => {
    if (!backend) return;
    await backend.auth.logout();
    clearCachedSession();
    setSession(null);
    setStatus('anonymous');
  }, [backend]);

  const updateAccount = useCallback(
    async (fullName: string) => {
      if (!backend) return;
      const next = await backend.auth.updateAccount(fullName);
      cacheSession(next);
      setSession(next);
    },
    [backend],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      backend,
      mode: backend?.mode ?? 'local',
      modeLabel: modeLabel(backend?.mode ?? 'local'),
      bootError,
      login,
      register,
      logout,
      updateAccount,
    }),
    [status, session, backend, bootError, login, register, logout, updateAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
