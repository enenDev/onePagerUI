import axios from "axios";

import { auth } from "@/config/firebaseConfig";
import { FIREBASE_TOKEN_KEY, logoutUser } from "@/services/authService";

const ApiBase = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * TODO: Backend must verify this Firebase ID token (Identity Toolkit / Admin SDK).
 * Temporary: FE sends Bearer only; FastAPI auth is not wired yet.
 * Keep Authorization: Bearer <token> and VITE_API_BASE_URL as the API origin.
 */
ApiBase.interceptors.request.use(async (request) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    localStorage.setItem(FIREBASE_TOKEN_KEY, token);
    request.headers.Authorization = `Bearer ${token}`;
    return request;
  }

  const storedToken =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(FIREBASE_TOKEN_KEY)
      : null;
  if (storedToken) {
    request.headers.Authorization = `Bearer ${storedToken}`;
  }
  return request;
});

ApiBase.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: 401 after token verify → sign out. Keep redirect to /login; do not
    // change one-pager error toasts. Skip this bounce until the API returns 401
    // for bad tokens (mocks / unverified APIs should not 401).
    if (error.response?.status === 401) {
      await logoutUser().catch(() => {
        localStorage.removeItem(FIREBASE_TOKEN_KEY);
      });
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default ApiBase;
