import axios from "axios";

/**
 * Shared Axios client. `baseURL` comes from `VITE_API_BASE_URL`.
 *
 * TODO: Point mock service bodies at this client when swapping to FastAPI
 * (e.g. apiClient.get("/api/me")). Keep existing function names, args, and
 * return types. Empty baseURL means same-origin (UI and API behind one host).
 */
export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});
