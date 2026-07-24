import axios from "axios";
import { getToken } from "@/lib/token";

/**
 * Singleton Axios instance used by every API call in the application.
 *
 * Key decisions:
 *  - baseURL reads from the environment so the same code works in dev/staging/prod.
 *  - withCredentials: true ensures cookies are sent on cross-origin requests.
 *  - timeout: 15s prevents silent hangs on slow connections.
 *  - The request interceptor reads the JWT from the token cookie and attaches
 *    it as a Bearer token because the backend auth middleware reads from the
 *    Authorization header, not from cookies.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401, dispatch a custom event so AuthContext can clear the session.
    // Avoids a circular dependency between api.js and AuthContext.
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }

    return Promise.reject(error);
  },
);

export default api;
