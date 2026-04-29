export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`UPDATE bills SET status = 'open' WHERE status NOT IN ('open', 'paid', 'completed', 'expired')`);
  pgm.sql(`UPDATE payments SET status = 'pending' WHERE status NOT IN ('pending', 'succeeded', 'failed', 'cancelled')`);

  pgm.createType("bill_status", ["open", "paid", "completed", "expired"]);
  pgm.createType("payment_status", ["pending", "succeeded", "failed", "cancelled"]);

  pgm.sql(`ALTER TABLE bills ALTER COLUMN status DROP DEFAULT`);
  pgm.sql(`ALTER TABLE bills ALTER COLUMN status TYPE bill_status USING status::bill_status`);
  pgm.sql(`ALTER TABLE bills ALTER COLUMN status SET DEFAULT 'open'`);

  pgm.sql(`ALTER TABLE payments ALTER COLUMN status DROP DEFAULT`);
  pgm.sql(`ALTER TABLE payments ALTER COLUMN status TYPE payment_status USING status::payment_status`);
  pgm.sql(`ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE bills ALTER COLUMN status DROP DEFAULT`);
  pgm.sql(`ALTER TABLE bills ALTER COLUMN status TYPE text USING status::text`);
  pgm.sql(`ALTER TABLE bills ALTER COLUMN status SET DEFAULT 'open'`);

  pgm.sql(`ALTER TABLE payments ALTER COLUMN status DROP DEFAULT`);
  pgm.sql(`ALTER TABLE payments ALTER COLUMN status TYPE text USING status::text`);
  pgm.sql(`ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'`);

  pgm.dropType("bill_status");
  pgm.dropType("payment_status");
};
