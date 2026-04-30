import pool from "../config/db.js";

/**
 * Insert a new merchant into the database
 * @param {Object} params
 * @param {string} params.name - Merchant display name
 * @param {string} params.email - Merchant email (unique)
 * @param {string} params.password - Bcrypt-hashed password
 * @param {string} params.stripe_account_id - Stripe Connect account ID
 * @returns {Promise<Object>} The inserted merchant row (id, name, email, stripe_account_id)
 */
export const insertMerchant = async ({
  name,
  email,
  password,
  stripe_account_id,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO merchants (name, email, password, stripe_account_id)
     VALUES ($1, $2, $3, $4) RETURNING id, name, email, stripe_account_id`,
    [name || null, email, password, stripe_account_id],
  );
  return rows[0];
};

/**
 * Find a merchant by email
 * @param {string} email - Merchant email address
 * @returns {Promise<Object|null>} The merchant row or null if not found
 */
export const findMerchantByEmail = async (email) => {
  const { rows } = await pool.query(
    "SELECT * FROM merchants WHERE email = $1",
    [email],
  );
  return rows[0] || null;
};

export const findMerchantByID = async (merchant_id) => {
  const { rows } = await pool.query("SELECT * FROM merchants WHERE id = $1", [
    merchant_id,
  ]);
  return rows[0] || null;
};

/**
 * Insert a new user into the database
 * @param {Object} params
 * @param {string} params.username - User display name
 * @param {string} params.email - User email (unique)
 * @param {string} params.password - Bcrypt-hashed password
 * @returns {Promise<Object>} The inserted user row (id, username, email)
 */
export const insertUser = async ({ username, email, password }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password)
     VALUES ($1, $2, $3) RETURNING id, username, email`,
    [username || null, email, password],
  );
  return rows[0];
};

/**
 * Find a user by email
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} The user row or null if not found
 */
export const findUserByEmail = async (email) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return rows[0] || null;
};

export const updateMerchantStripeAccountId = async ({
  id,
  stripe_account_id,
}) => {
  const { rows } = await pool.query(
    `UPDATE merchants SET stripe_account_id = $1 WHERE id = $2 RETURNING id, name, email, stripe_account_id`,
    [stripe_account_id, id],
  );

  return rows[0];
};

export const findMerchantByStripeAccountId = async (stripe_account_id) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM merchants WHERE stripe_account_id = $1,
    `,
    [stripe_account_id],
  );

  return rows[0] || null;
};

export const updateMerchantOnboarding = async ({
  id,
  charges_enabled,
  details_submitted,
}) => {
  const { rows } = await pool.query(
    `UPDATE merchants SET charges_enabled = $1, details_submitted = $2
     WHERE id = $3 RETURNING id, name, email, stripe_account_id, charges_enabled, details_submitted`,
    [charges_enabled, details_submitted, id],
  );
  return rows[0];
};
