import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

/**
 * Generate a signed JWT token
 * @param {number} id - User or merchant ID
 * @param {string} role - "merchant" or "user"
 * @returns {string} Signed JWT token
 */
export const signToken = (id, role) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload ({ id, role, iat, exp })
 * @throws {jwt.JsonWebTokenError} If token is invalid or expired
 */
export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
