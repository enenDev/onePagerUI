import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/config/firebaseConfig";
import {
  completeSsoRedirect,
  FIREBASE_TOKEN_KEY,
} from "@/services/authService";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  redirectError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // TODO: Remove this 8s fallback once Firebase API key / iframe is stable.
    // Keep onAuthStateChanged writing firebaseToken; not a FastAPI call.
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 8000);

    void completeSsoRedirect().then((errorMessage) => {
      if (!cancelled && errorMessage) {
        setRedirectError(errorMessage);
      }
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        if (currentUser) {
          const token = await currentUser.getIdToken();
          localStorage.setItem(FIREBASE_TOKEN_KEY, token);
          setUser(currentUser);
        } else {
          localStorage.removeItem(FIREBASE_TOKEN_KEY);
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        setRedirectError(error.message);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, redirectError }),
    [user, loading, redirectError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
