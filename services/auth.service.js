import api from "@/lib/api";
import { setToken, clearToken } from "@/lib/token";

/**
 * Register a new user.
 * Stores the returned JWT and returns the user object.
 *
 * @param {{ firstName: string, lastName: string, email: string, password: string }} data
 * @returns {Promise<Object>} user
 */
export async function signup({ firstName, lastName, email, password }) {
  const { data } = await api.post("/auth/signup", {
    firstName,
    lastName,
    email,
    password,
  });
  setToken(data.data.token);
  return data.data.user;
}

/**
 * Authenticate an existing user.
 * Stores the returned JWT and returns the user object.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<Object>} user
 */
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  setToken(data.data.token);
  return data.data.user;
}

/**
 * Fetch the currently authenticated user via the stored token.
 * Throws a 401 Axios error if the token is missing or expired.
 *
 * @returns {Promise<Object>} user
 */
export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data.data.user;
}

/**
 * Clear the local token cookie.
 * The backend uses stateless JWTs so no server call is needed.
 */
export async function logout() {
  clearToken();
}

/**
 * Request a password-reset email.
 * The backend always returns a success response to prevent email enumeration.
 *
 * @param {string} email
 * @returns {Promise<Object>} response data
 */
export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}
