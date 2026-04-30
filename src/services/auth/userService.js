import bcrypt from "bcryptjs";
import AppError from "../../utils/appError.js";
import { signToken } from "../../utils/jwt.js";
import * as authRepo from "../../repositories/authRepo.js";

/**
 * Register a new user — hashes password and stores in DB
 * @param {Object} params
 * @param {string} params.username - User display name
 * @param {string} params.email - User email
 * @param {string} params.password - Plain-text password
 * @returns {Promise<{token: string, user: Object}>} JWT token + user data
 */
export const createUser = async ({ username, email, password }) => {
  const hash = await bcrypt.hash(password, 10);
  const user = await authRepo.insertUser({ username, email, password: hash });
  return { token: signToken(user.id, "user"), user };
};

/**
 * Authenticate a user — verifies email/password and returns JWT
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - Plain-text password
 * @returns {Promise<{token: string, user: Object}>} JWT token + user data
 * @throws {AppError} 401 if credentials are invalid
 */
export const authenticateUser = async ({ email, password }) => {
  const user = await authRepo.findUserByEmail(email);

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new AppError(401, "Invalid credentials");
  }

  return {
    token: signToken(user.id, "user"),
    user: { id: user.id, username: user.username, email: user.email },
  };
};
