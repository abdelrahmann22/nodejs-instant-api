import asyncHandler from "express-async-handler";
import AppError from "../../utils/appError.js";
import * as paymentService from "../../services/payments/paymentsServices.js";
import * as paymentRepo from "../../repositories/paymentsRepo.js";

/**
 * Handle initiate payment request — user pays their share of a bill
 * @param {import('express').Request} req - Express request (body: bill_id, token, amount; user from protect middleware)
 * @param {import('express').Response} res - Express response
 */
export const initiatePaymentController = asyncHandler(async (req, res) => {
  const { bill_id, token, amount } = req.body;
  const user_id = req.user.id;

  if (!bill_id || !token || !amount) {
    throw new AppError(400, "bill_id, token, and amount are required");
  }

  const result = await paymentService.initiatePayment({
    bill_id,
    token,
    amount,
    user_id,
  });

  res.json(result);
});

/**
 * Handle get payments for a bill — returns all succeeded payments for the given bill with user names
 * @param {import('express').Request} req - Express request (params: bill_id)
 * @param {import('express').Response} res - Express response
 */
export const getPaymentsByBillId = asyncHandler(async (req, res) => {
  const { bill_id } = req.params;

  if (!bill_id) {
    throw new AppError(400, "bill_id is required");
  }

  const payments = await paymentRepo.findPaymentsByBillId(bill_id);

  res.json(payments);
});

/**
 * Handle get user's payment activity list — returns all payments by the authenticated user with bill info
 * @param {import('express').Request} req - Express request (user from protect middleware)
 * @param {import('express').Response} res - Express response
 */
export const getPaymentsByUser = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const payments = await paymentRepo.findPaymentsByUserId(user_id);

  res.json(payments);
});
