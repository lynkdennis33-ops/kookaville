import crypto from 'crypto';

/**
 * Generate a secure password reset token
 * WHY use crypto.randomBytes(): Cryptographically secure random generation.
 * crypto.randomBytes() uses OS entropy sources; Math.random() is not secure.
 * Token is returned as hex string for URL-safe usage in reset links.
 * @param {number} length - Number of random bytes (default 32 = 64 hex chars)
 * @returns {string} Hex-encoded random token
 */
export function generateResetToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a reset token for storage in database
 * WHY hash tokens: Tokens must never be stored in plain text in the database.
 * If database is compromised, attackers cannot use unhashed tokens to reset passwords.
 * We use SHA-256 hash; token verification compares hash(supplied) === hash(stored).
 * WHY SHA-256: Fast, deterministic, and sufficient for this use case.
 * @param {string} token - Plain-text token to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a reset token by hashing it and comparing with stored hash
 * @param {string} suppliedToken - Token provided by user in reset request
 * @param {string} storedHash - Hashed token stored in database
 * @returns {boolean} True if token is valid, false otherwise
 */
export function verifyResetToken(suppliedToken, storedHash) {
  const suppliedHash = hashResetToken(suppliedToken);
  return suppliedHash === storedHash;
}
