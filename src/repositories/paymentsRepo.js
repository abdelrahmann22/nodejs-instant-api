import pool from "../config/db.js";

/**
 * Insert a new pending payment
 * @param {Object} params
 * @param {number} params.bill_id - FK to bills table
 * @param {number} params.user_id - FK to users table
 * @param {number} params.amount - Payment amount
 * @returns {Promise<Object>} The inserted payment row
 */
export const insertPayment = async ({ bill_id, user_id, amount }) => {
  const { rows } = await pool.query(
    `INSERT INTO payments (bill_id, user_id, amount, status)
     VALUES ($1, $2, $3, $4::payment_status) RETURNING *`,
    [bill_id, user_id, amount, "pending"],
  );
  return rows[0];
};

/**
 * Find a payment by ID
 * @param {number} id - Payment primary key
 * @returns {Promise<Object|undefined>} The payment row or undefined
 */
export const findPaymentById = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE id = $1`,
    [id],
  );
  return rows[0];
};

/**
 * Update payment status after Stripe confirmation
 * @param {number} id - Payment primary key
 * @param {string} status - New status ("succeeded" or "failed")
 * @param {string} payment_intent_id - Stripe payment intent ID
 * @returns {Promise<Object>} The updated payment row
 */
export const updatePaymentStatus = async ({ id, status, payment_intent_id }) => {
  const { rows } = await pool.query(
    `UPDATE payments SET status = $1::payment_status, payment_intent_id = $2, paid_at = CASE WHEN $1::text = 'succeeded' THEN NOW() ELSE NULL END
     WHERE id = $3 AND status = 'pending' RETURNING *`,
    [status, payment_intent_id, id],
  );
  return rows[0];
};

export const cancelPaymentIfPending = async (paymentId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT status, bill_id FROM payments WHERE id = $1 FOR UPDATE`,
      [paymentId],
    );

    const payment = rows[0];

    if (!payment || payment.status !== "pending") {
      await client.query("ROLLBACK");
      return null;
    }

    const { rows: updated } = await client.query(
      `UPDATE payments SET status = 'cancelled'::payment_status, payment_intent_id = NULL WHERE id = $1 RETURNING *`,
      [paymentId],
    );

    await client.query("COMMIT");
    return updated[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Find all succeeded payments for a bill with user names
 * @param {number} bill_id - Bill primary key
 * @returns {Promise<Array<Object>>} Array of payment rows with user_name
 */
export const findPaymentsByBillId = async (bill_id) => {
  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.amount,
       p.status,
       p.paid_at,
       p.created_at,
       COALESCE(u.username, u.email, 'Anonymous') as user_name
     FROM payments p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.bill_id = $1 AND p.status = 'succeeded'
     ORDER BY p.paid_at DESC NULLS LAST`,
    [bill_id],
  );
  return rows;
};

/**
 * Find all payments for a user with bill and merchant info — used for user activity list
 * @param {number} user_id - User primary key
 * @returns {Promise<Array<Object>>} Array of payment rows with bill_title, bill_token, merchant_name, contributors_count
 */
export const findPaymentsByUserId = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.bill_id, p.amount, p.status, p.paid_at, p.created_at,
       b.title as bill_title,
       b.currency,
       b.token as bill_token,
       m.name as merchant_name,
       (SELECT COUNT(*) FROM payments WHERE bill_id = p.bill_id AND status = 'succeeded') as contributors_count
     FROM payments p
     JOIN bills b ON p.bill_id = b.id
     JOIN merchants m ON b.merchant_id = m.id
     WHERE p.user_id = $1
     ORDER BY p.paid_at DESC NULLS LAST`,
    [user_id],
  );
  return rows;
};
