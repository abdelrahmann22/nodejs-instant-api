import AppError from "../../utils/appError.js";
import * as authService from "../../services/auth/authService.js";

/**
 * Handle merchant signup request
 * @param {import('express').Request} req - Express request (body: name, email, password, stripe_account_id)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export const merchantSignup = async (req, res, next) => {
  const { name, email, password, stripe_account_id } = req.body;

  if (!email || !password || !stripe_account_id) {
    return next(new AppError(400, "email, password, and stripe_account_id are required"));
  }

  try {
    const result = await authService.createMerchant({ name, email, password, stripe_account_id });
    res.status(201).json(result);
  } catch (err) {
    if (err.code === "23505") {
      return next(new AppError(409, "Email already exists"));
    }
    next(err);
  }
};

/**
 * Handle merchant login request
 * @param {import('express').Request} req - Express request (body: email, password)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export const merchantLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, "email and password are required"));
  }

  try {
    const result = await authService.authenticateMerchant({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle user signup request
 * @param {import('express').Request} req - Express request (body: username, email, password)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export const userSignup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, "email and password are required"));
  }

  try {
    const result = await authService.createUser({ username, email, password });
    res.status(201).json(result);
  } catch (err) {
    if (err.code === "23505") {
      return next(new AppError(409, "Email already exists"));
    }
    next(err);
  }
};

/**
 * Handle user login request
 * @param {import('express').Request} req - Express request (body: email, password)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export const userLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, "email and password are required"));
  }

  try {
    const result = await authService.authenticateUser({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
