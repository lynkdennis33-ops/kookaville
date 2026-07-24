/**
 * Token cookie helpers.
 *
 * The JWT returned by the backend is stored in a first-party JavaScript-
 * readable cookie so that:
 *   - lib/api.js can read it and attach it as a Bearer token on every request.
 *   - proxy.js can read it at the edge and redirect unauthenticated users.
 *
 * Security note: Because the backend auth middleware reads the token from the
 * Authorization header (not a cookie), the cookie is only used for session
 * persistence. A forged cookie will still fail at the API level.
 */

const TOKEN_KEY = "token";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function setToken(token) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${TOKEN_KEY}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
