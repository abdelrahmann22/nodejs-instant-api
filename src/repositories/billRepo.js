import pool from "../config/db.js";

/**
 * Insert a new bill into the database
 * @param {Object} params
 * @param {number} params.merchant_id - FK to merchants table
 * @param {number} params.amount - Total bill amount
 * @param {number} params.fees - Additional fees
 * @param {string} params.currency - Currency code (e.g. "usd")
 * @param {Array<{title: string, quantity: number, price: number}>} params.items - Bill line items
 * @param {string} params.token - Unique access token for QR URL
 * @param {Date} params.expires_at - Expiration timestamp
 * @returns {Promise<Object>} The inserted bill row
 */
export const insertBill = async ({
  merchant_id,
  amount,
  fees,
  currency,
  items,
  token,
  expires_at,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO bills (merchant_id, amount, fees, currency, items, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      merchant_id,
      amount,
      fees,
      currency,
      JSON.stringify(items),
      token,
      expires_at,
    ],
  );
  return rows[0];
};

/**
 * Find a bill by ID and token
 * @param {Object} params
 * @param {number} params.billId - Bill primary key
 * @param {string} params.token - Bill access token
 * @returns {Promise<Object|undefined>} The bill row or undefined if not found
 */
export const findBill = async ({ billId, token }) => {
  const { rows } = await pool.query(
    `SELECT * FROM bills WHERE id = $1 AND token = $2`,
    [billId, token],
  );
  return rows[0];
};

/**
 * Find all bills for a given merchant
 * @param {number} merchantId - Merchant primary key
 * @returns {Promise<Array<Object>>} Array of bill rows
 */
export const findBillsByMerchantId = async (merchantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM bills WHERE merchant_id = $1 ORDER BY created_at DESC`,
    [merchantId],
  );
  return rows;
};

/**
 * Calculate total paid amount for a bill from succeeded payments
 * @param {number} billId - Bill primary key
 * @returns {Promise<number>} Sum of succeeded payment amounts (0 if none)
 */
export const findPaidAmountByBillId = async (billId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE bill_id = $1 AND status = 'succeeded'`,
    [billId],
  );
  return parseFloat(rows[0].paid_amount);
};
