import AppError from "../utils/appError.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Protect middleware — verifies Bearer JWT token and attaches decoded payload to req.user
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 * @returns {void}
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Not authenticated"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError(401, "Invalid or expired token"));
  }
};

/**
 * Role-based access control middleware — restricts route to specified roles
 * @param {...string} roles - Allowed roles (e.g. "merchant", "user")
 * @returns {import('express').RequestHandler} Middleware that checks req.user.role
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Not authorized for this action"));
    }

    if (req.user.role === "merchant") {
      req.merchant = req.user;
    }

    next();
  };
};
