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
  FIREBASE_TOKEN_KEY,
  getAuthErrorMessage,
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

    // SSO uses signInWithPopup, so the credential arrives on the same page and
    // onAuthStateChanged fires with the user. On reload, browserLocalPersistence
    // restores the session and this fires again with the stored user.
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (cancelled) return;
        try {
          if (currentUser) {
            await storeUser(currentUser);
            if (cancelled) return;
            setUser(currentUser);
          } else {
            setUser(null);
            localStorage.removeItem(FIREBASE_TOKEN_KEY);
          }
        } catch (error) {
          // getIdToken can fail (e.g. network); still surface the signed-in
          // user — ApiBase refreshes the token on the next request.
          if (cancelled) return;
          setRedirectError(getAuthErrorMessage(error));
          if (currentUser) setUser(currentUser);
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      (error) => {
        if (cancelled) return;
        setRedirectError(getAuthErrorMessage(error));
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
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
