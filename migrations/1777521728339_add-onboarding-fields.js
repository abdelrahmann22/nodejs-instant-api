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
  pgm.sql(`
    ALTER TABLE merchants
      ADD charges_enabled BOOLEAN DEFAULT FALSE,
      ADD details_submitted BOOLEAN DEFAULT FALSE;

    ALTER TABLE merchants ALTER COLUMN stripe_account_id DROP NOT NULL;
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE merchants ALTER COLUMN stripe_account_id SET NOT NULL;

    ALTER TABLE merchants
      DROP COLUMN charges_enabled,
      DROP COLUMN details_submitted;
    `);
};
