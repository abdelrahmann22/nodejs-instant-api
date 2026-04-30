import AppError from "../../utils/appError.js";
import * as merchantService from "../../services/auth/merchantService.js";
import * as authRepo from "../../repositories/authRepo.js";
import asyncHandler from "express-async-handler";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Handle merchant signup request
 * @param {import('express').Request} req - Express request (body: name, email, password)
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export const merchantSignup = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError(400, "name, email and password are required"));
  }

  try {
    const result = await merchantService.createMerchant({
      name,
      email,
      password,
    });
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
    const result = await merchantService.authenticateMerchant({
      email,
      password,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle merchant onboarding link request — creates Connect account if needed, returns Stripe onboarding URL
 * @param {import('express').Request} req - Express request (merchant from protect middleware)
 * @param {import('express').Response} res - Express response
 */
export const getOnboardingLink = asyncHandler(async (req, res) => {
  const merchant_id = req.merchant.id;

  const merchant = await authRepo.findMerchantByID(merchant_id);

  if (!merchant.stripe_account_id) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: { transfers: { requested: true } },
    });

    await authRepo.updateMerchantStripeAccountId({
      id: merchant.id,
      stripe_account_id: account.id,
    });

    merchant.stripe_account_id = account.id;
  }

  const accountLink = await stripe.accountLinks.create({
    account: merchant.stripe_account_id,
    type: "account_onboarding",
    return_url: `${process.env.FRONTEND_URL}/connect/success`,
    refresh_url: `${process.env.FRONTEND_URL}/connect/success`,
  });

  res.json({ url: accountLink.url });
});
