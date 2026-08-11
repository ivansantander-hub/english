import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import { clearStoredToken, getStoredToken, setStoredToken } from "../../lib/auth-storage.js";
import { trpc } from "../../lib/trpc.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "user";
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<void>;
  register: (email: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => getStoredToken() !== null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isResolving, setIsResolving] = useState(hasToken);

  const meQuery = trpc.auth.me.useQuery(undefined, { enabled: hasToken, retry: false });
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!hasToken) {
      setIsResolving(false);
      return;
    }
    if (meQuery.isSuccess) {
      setUser(meQuery.data);
      setIsResolving(false);
    } else if (meQuery.isError) {
      clearStoredToken();
      setHasToken(false);
      setUser(null);
      setIsResolving(false);
    }
  }, [hasToken, meQuery.isSuccess, meQuery.isError, meQuery.data]);

  async function login(email: string, pin: string): Promise<void> {
    const result = await loginMutation.mutateAsync({ email, pin });
    setStoredToken(result.token);
    queryClient.clear();
    setUser(result.user);
    setHasToken(true);
  }

  async function register(email: string, pin: string): Promise<void> {
    const result = await registerMutation.mutateAsync({ email, pin });
    setStoredToken(result.token);
    queryClient.clear();
    setUser(result.user);
    setHasToken(true);
  }

  async function logout(): Promise<void> {
    await logoutMutation.mutateAsync().catch(() => undefined);
    clearStoredToken();
    queryClient.clear();
    setUser(null);
    setHasToken(false);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading: isResolving, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
