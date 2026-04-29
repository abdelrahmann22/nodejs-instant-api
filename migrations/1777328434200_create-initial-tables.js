/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("merchants", {
    id: { type: "serial", primaryKey: true },
    stripe_account_id: { type: "text", notNull: true },
    name: { type: "text" },
    email: { type: "text", unique: true },
    password: { type: "text" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    username: { type: "text" },
    email: { type: "text", unique: true },
    password: { type: "text" },
    stripe_customer_id: { type: "text" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("bills", {
    id: { type: "serial", primaryKey: true },
    merchant_id: {
      type: "integer",
      notNull: true,
      references: "merchants(id)",
      onDelete: "RESTRICT",
    },
    currency: { type: "text", default: "gbp" },
    amount: { type: "decimal(12, 2)" },
    fees: { type: "decimal(12, 2)" },
    status: { type: "text", default: "open" },
    items: { type: "jsonb", notNull: true },
    token: { type: "text", unique: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    expires_at: { type: "timestamp" },
  });

  pgm.createTable("payments", {
    id: { type: "serial", primaryKey: true },
    bill_id: { type: "integer", notNull: true, references: "bills(id)" },
    user_id: { type: "integer", notNull: true, references: "users(id)" },
    amount: { type: "decimal(12, 2)" },
    payment_intent_id: { type: "text", unique: true },
    status: { type: "text", default: "pending" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    paid_at: { type: "timestamp" },
  });

  // Index on token for fast QR lookups
  pgm.createIndex("bills", "token");
  // Index on payment_intent_id for webhook lookups
  pgm.createIndex("payments", "payment_intent_id");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("payments");
  pgm.dropTable("bills");
  pgm.dropTable("users");
  pgm.dropTable("merchants");
};
