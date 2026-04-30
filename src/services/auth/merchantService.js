import bcrypt from "bcryptjs";
import AppError from "../../utils/appError.js";
import { signToken } from "../../utils/jwt.js";
import * as authRepo from "../../repositories/authRepo.js";

/**
 * Register a new merchant — hashes password and stores in DB
 * @param {Object} params
 * @param {string} params.name - Merchant display name
 * @param {string} params.email - Merchant email
 * @param {string} params.password - Plain-text password
 * @returns {Promise<{token: string, merchant: Object}>} JWT token + merchant data
 */
export const createMerchant = async ({ name, email, password }) => {
  const hash = await bcrypt.hash(password, 10);
  const merchant = await authRepo.insertMerchant({
    name,
    email,
    password: hash,
    stripe_account_id: null,
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
