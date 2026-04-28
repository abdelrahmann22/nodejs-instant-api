import asyncHandler from "express-async-handler";
import AppError from "../../utils/appError.js";
import * as billService from "../../services/bills/billService.js";

/**
 * Handle create bill request — merchant creates a shared bill with items
 * @param {import('express').Request} req - Express request (body: merchant_id, amount, fees, currency, items)
 * @param {import('express').Response} res - Express response
 */
export const createBill = asyncHandler(async (req, res) => {
  const { amount, fees, currency, items, merchant_id } = req.body;

  if (!amount || !items) {
    throw new AppError(400, "amount and items are required");
  }

  const bill = await billService.createBill({
    merchant_id,
    amount,
    fees,
    currency,
    items,
  });

  res.status(201).json({
    message: "Bill created successfully",
    bill,
  });
});

/**
 * Handle get bill request — user scans QR and views bill with payment info
 * @param {import('express').Request} req - Express request (params: id, query: token)
 * @param {import('express').Response} res - Express response
 */
export const getBill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  if (!id || !token) {
    throw new AppError(400, "bill id and token are required");
  }

  const bill = await billService.getBill({
    billId: id,
    token,
  });

  res.json(bill);
});
