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
  title,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO bills (merchant_id, amount, fees, currency, items, token, expires_at, title)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      merchant_id,
      amount,
      fees,
      currency,
      JSON.stringify(items),
      token,
      expires_at,
      title,
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
    `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE bill_id = $1 AND status IN ('succeeded', 'pending')`,
    [billId],
  );
  return parseFloat(rows[0].paid_amount);
};

/**
 * Count payments (contributors) for a bill — matches findPaidAmountByBillId statuses
 * @param {number} billId - Bill primary key
 * @returns {Promise<number>} Count of succeeded + pending payments
 */
export const countContributorsByBillId = async (billId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM payments WHERE bill_id = $1 AND status IN ('succeeded', 'pending')`,
    [billId],
  );
  return parseInt(rows[0].count, 10);
};

/**
 * Calculate total succeeded amount for a bill (only completed payments)
 * @param {number} billId - Bill primary key
 * @returns {Promise<number>} Sum of succeeded payment amounts (0 if none)
 */
export const findSucceededAmountByBillId = async (billId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE bill_id = $1 AND status = 'succeeded'`,
    [billId],
  );
  return parseFloat(rows[0].paid_amount);
};

export const findPendingAmountByBillId = async (billId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS pending_amount FROM payments WHERE bill_id = $1 AND status = 'pending'`,
    [billId],
  );
  return parseFloat(rows[0].pending_amount);
};

/**
 * Find a bill by ID only (no token required)
 * @param {number} billId - Bill primary key
 * @returns {Promise<Object|undefined>} The bill row or undefined if not found
 */
export const findBillById = async (billId) => {
  const { rows } = await pool.query(`SELECT * FROM bills WHERE id = $1`, [
    billId,
  ]);
  return rows[0];
};

/**
 * Update bill status (e.g. to "completed" or "expired")
 * @param {Object} params
 * @param {number} params.id - Bill primary key
 * @param {string} params.status - New status
 * @returns {Promise<Object>} The updated bill row
 */
export const updateBillStatus = async ({ id, status }) => {
  const { rows } = await pool.query(
    `UPDATE bills SET status = $1::bill_status WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return rows[0];
};

/**
 * Mark a bill as transferred with the Stripe transfer ID
 * @param {Object} params
 * @param {number} params.id - Bill primary key
 * @param {string} params.transferId - Stripe transfer ID
 * @returns {Promise<Object>} The updated bill row
 */
export const updateBillTransfer = async ({ id, transferId }) => {
  const { rows } = await pool.query(
    `UPDATE bills SET transferred = true, transfer_id = $1 WHERE id = $2 RETURNING *`,
    [transferId, id],
  );
  return rows[0];
};

/**
 * Mark a bill as paid if all succeeded payments cover the full amount — runs inside a transaction with row lock
 * @param {number} billId - Bill primary key
 * @returns {Promise<{bill: Object, isPaid: boolean}>} The bill row and whether it was marked paid
 */
export const markBillPaidIfFullyCovered = async (billId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: billRows } = await client.query(
      `SELECT * FROM bills WHERE id = $1 FOR UPDATE`,
      [billId],
    );
    const bill = billRows[0];

    if (!bill) {
      await client.query("ROLLBACK");
      return { bill: null, isPaid: false };
    }

    if (bill.status !== "open") {
      await client.query("ROLLBACK");
      return { bill, isPaid: false };
    }

    const { rows } = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE bill_id = $1 AND status = 'succeeded'`,
      [billId],
    );
    const succeededAmount = parseFloat(rows[0].paid_amount);
    const billTotal = parseFloat(bill.amount);

    if (succeededAmount >= billTotal) {
      await client.query(`UPDATE bills SET status = 'paid' WHERE id = $1`, [
        billId,
      ]);
      bill.status = "paid";
      await client.query("COMMIT");
      return { bill, isPaid: true };
    }

    await client.query("COMMIT");
    return { bill, isPaid: false };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
