import { nanoid } from "nanoid";
import AppError from "../../utils/appError.js";
import * as billRepo from "../../repositories/billRepo.js";
import * as authRepo from "../../repositories/authRepo.js";

/**
 * Create a new bill — generates token, sets 10min expiry, inserts into DB
 * @param {Object} params
 * @param {number} params.merchant_id - FK to merchants table
 * @param {number} params.amount - Total bill amount
 * @param {number} [params.fees=0] - Additional fees
 * @param {string} [params.currency="gbp"] - Currency code
 * @param {Array<{title: string, quantity: number, price: number}>} params.items - Bill line items
 * @returns {Promise<Object>} The bill row with qr_url appended
 */
export const createBill = async ({
  merchant_id,
  amount,
  fees,
  currency,
  items,
  title,
}) => {
  const token = nanoid(8);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  const bill = await billRepo.insertBill({
    merchant_id,
    amount,
    fees: fees || 0,
    currency: currency || "gbp",
    items,
    token,
    expires_at: expires_at,
    title,
  });

  return { ...bill, qr_url: `/bills/${bill.id}?token=${token}` };
};

/**
 * Get a bill by ID and token — validates access, checks expiry, computes payment info
 * @param {Object} params
 * @param {number} params.billId - Bill primary key
 * @param {string} params.token - Bill access token
 * @returns {Promise<Object>} Bill data with paid_amount and remaining, without token/merchant_id
 * @throws {AppError} 404 if bill not found
 */
export const getBill = async ({ billId, token }) => {
  const bill = await billRepo.findBill({ billId, token });

  if (!bill) {
    throw new AppError(404, "Bill not found");
  }

  const paid_amount = await billRepo.findPaidAmountByBillId(billId);
  const remaining = parseFloat(bill.amount) - paid_amount;

  const { token: _, merchant_id: __, ...billData } = bill;

  return { ...billData, paid_amount, remaining };
};

/**
 * Get all bills for a merchant
 * @param {number} merchantId - Merchant primary key
 * @returns {Promise<Array<Object>>} Array of bills for the merchant
 * @throws {AppError} 404 if no bills found
 */
export const getBillsByMerchantId = async (merchantId) => {
  const merchant = await authRepo.findMerchantByID(merchantId);

  if (!merchant) {
    throw new AppError(404, "Merchant not found");
  }

  const bills = await billRepo.findBillsByMerchantId(merchantId);

  if (!bills.length) {
    throw new AppError(404, "No bills found for this merchant");
  }

  return bills;
};
