import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../../utils/appError.js";
import * as authRepo from "../../repositories/authRepo.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

/**
 * Generate a signed JWT token
 * @param {number} id - User or merchant ID
 * @param {string} role - "merchant" or "user"
 * @returns {string} Signed JWT token
 */
const signToken = (id, role) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Register a new merchant — hashes password and stores in DB
 * @param {Object} params
 * @param {string} params.name - Merchant display name
 * @param {string} params.email - Merchant email
 * @param {string} params.password - Plain-text password
 * @param {string} params.stripe_account_id - Stripe Connect account ID
 * @returns {Promise<{token: string, merchant: Object}>} JWT token + merchant data
 */
export const createMerchant = async ({
  name,
  email,
  password,
  stripe_account_id,
}) => {
  const hash = await bcrypt.hash(password, 10);
  const merchant = await authRepo.insertMerchant({
    name,
    email,
    password: hash,
    stripe_account_id,
  });
  return { token: signToken(merchant.id, "merchant"), merchant };
};

/**
 * Authenticate a merchant — verifies email/password and returns JWT
 * @param {Object} params
 * @param {string} params.email - Merchant email
 * @param {string} params.password - Plain-text password
 * @returns {Promise<{token: string, merchant: Object}>} JWT token + merchant data
 * @throws {AppError} 401 if credentials are invalid
 */
export const authenticateMerchant = async ({ email, password }) => {
  const merchant = await authRepo.findMerchantByEmail(email);

  if (!merchant) {
    throw new AppError(401, "Invalid credentials");
  }

  const match = await bcrypt.compare(password, merchant.password);

  if (!match) {
    throw new AppError(401, "Invalid credentials");
  }

  return {
    token: signToken(merchant.id, "merchant"),
    merchant: {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      stripe_account_id: merchant.stripe_account_id,
    },
  };
};

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
