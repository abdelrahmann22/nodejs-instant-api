import AppError from "../../utils/appError.js";
import * as userService from "../../services/auth/userService.js";

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
    const result = await userService.createUser({ username, email, password });
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
    const result = await userService.authenticateUser({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
