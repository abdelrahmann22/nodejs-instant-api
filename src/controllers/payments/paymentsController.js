import asyncHandler from "express-async-handler";
import AppError from "../../utils/appError.js";
import * as paymentService from "../../services/payments/paymentsServices.js";
import * as paymentRepo from "../../repositories/paymentsRepo.js";

/**
 * Handle initiate payment request — user pays their share of a bill
 * @param {import('express').Request} req - Express request (body: bill_id, token, amount, user_id)
 * @param {import('express').Response} res - Express response
 */
export const initiatePaymentController = asyncHandler(async (req, res) => {
  const { user_id, bill_id, token, amount } = req.body;

  if (!bill_id || !token || !amount || !user_id) {
    throw new AppError(400, "bill_id, token, amount, and user_id are required");
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
 * Handle get payments for a bill — returns all payments for the given bill
 * @param {import('express').Request} req - Express request (params: bill_id)
 * @param {import('express').Response} res - Express response
 */
export const getPaymentsByBillId = asyncHandler(async (req, res) => {
  const { bill_id } = req.params;

  if (!bill_id) {
    throw new AppError(400, "bill_id is required");
  }

  const payments = await paymentRepo.findPaymentsByBillId(bill_id);

  if (!payments.length) {
    throw new AppError(404, "No payments found for this bill");
  }

  res.json(payments);
});
