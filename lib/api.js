import axios from "axios";

/**
 * Singleton Axios instance used by every API call in the application.
 *
 * Key decisions:
 *  - baseURL reads from the environment so the same code works in dev/staging/prod.
 *  - withCredentials: true is required for the Express backend to set and receive
 *    the HTTP-only JWT cookie across origins (localhost:3000 → localhost:5000).
 *  - timeout: 15s prevents silent hangs on slow connections.
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
    // TODO Phase B: Add any outgoing request transformations here.
    // Examples:
    //   - Attach a CSRF token header if the backend requires it.
    //   - Inject a request ID for distributed tracing.
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO Phase B: Trigger a global logout when the server returns 401.
      //
      // The Axios instance cannot import AuthContext directly (circular dependency).
      // Instead, dispatch a custom browser event that AuthContext listens for:
      //
      //   if (typeof window !== "undefined") {
      //     window.dispatchEvent(new Event("auth:unauthorized"));
      //   }
      //
      // Then in AuthContext.jsx, add:
      //   useEffect(() => {
      //     const handler = () => logout();
      //     window.addEventListener("auth:unauthorized", handler);
      //     return () => window.removeEventListener("auth:unauthorized", handler);
      //   }, [logout]);
    }

    return Promise.reject(error);
  },
);

export default api;
