import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { LoginResponse } from "../api/auth";
import {
  loginApi,
  getMeApi,
  getToken,
  setToken,
  removeToken,
  isAuthenticated as checkAuth,
} from "../api/auth";

interface AuthContextType {
  user: LoginResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute isAuthenticated from user state
  const authenticated = user !== null;

  // On mount, try to restore session from token
  useEffect(() => {
    async function restoreSession() {
      if (!checkAuth()) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMeApi();
        const token = getToken();
        setUser({
          access_token: token!,
          token_type: "bearer",
          username: me.username,
        });
      } catch {
        // Token invalid, clear it
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      setToken(res.access_token);
      setUser(res);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "登录失败";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: authenticated,
        loading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
