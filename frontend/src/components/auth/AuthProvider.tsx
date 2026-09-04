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
  clearSsoRedirectPending,
  completeSsoRedirect,
  FIREBASE_TOKEN_KEY,
} from "@/services/authService";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  redirectError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function storeUser(currentUser: User) {
  const token = await currentUser.getIdToken();
  localStorage.setItem(FIREBASE_TOKEN_KEY, token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setRedirectError(
          (prev) => prev ?? "Sign-in is taking too long. Please try again.",
        );
        setLoading(false);
      }
    }, 20000);

    const finish = (nextUser: User | null) => {
      window.clearTimeout(timeoutId);
      setUser(nextUser);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (cancelled || !currentUser) return;
        await storeUser(currentUser);
        if (cancelled) return;
        clearSsoRedirectPending();
        finish(currentUser);
      },
      (error) => {
        if (cancelled) return;
        setRedirectError(error.message);
        finish(null);
      },
    );

    void (async () => {
      const errorMessage = await completeSsoRedirect();
      if (cancelled) return;
      if (errorMessage) {
        setRedirectError(errorMessage);
      }
      await auth.authStateReady();
      if (cancelled) return;
      const currentUser = auth.currentUser;
      if (currentUser) {
        await storeUser(currentUser);
        if (cancelled) return;
        finish(currentUser);
      } else {
        localStorage.removeItem(FIREBASE_TOKEN_KEY);
        finish(null);
      }
      clearSsoRedirectPending();
    })();

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
