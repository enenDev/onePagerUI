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
  isSsoRedirectPending,
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

    // REVERT WHEN: SSO session is reliable (hosted UI or Vite proxy working).
    // Temporary: 20s cap so Login is not stuck on "Signing you in…".
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
      // Never wipe a signed-in user with null — identitytoolkit can 200
      // after getRedirectResult returns empty, then onAuthStateChanged fires.
      if (nextUser) {
        setUser(nextUser);
      }
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
        setLoading(false);
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

      let currentUser = auth.currentUser;
      if (!currentUser) {
        // REVERT WHEN: getRedirectResult reliably returns the user (drop the 500ms wait).
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        if (cancelled) return;
        currentUser = auth.currentUser;
      }

      if (currentUser) {
        await storeUser(currentUser);
        if (cancelled) return;
        finish(currentUser);
        clearSsoRedirectPending();
      } else {
        window.clearTimeout(timeoutId);
        setLoading(false);
        if (isSsoRedirectPending()) {
          // REVERT WHEN: local/prod same-origin auth works — this copy is a cookie-block hint.
          setRedirectError(
            (prev) =>
              prev ??
              "Microsoft sign-in finished, but Firebase did not give this app a session. Allow cookies for firebaseapp.com, or try Edge / another Chrome profile.",
          );
        }
      }
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
