export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("bills", {
    transferred: { type: "boolean", default: false },
    transfer_id: { type: "text" },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("bills", "transfer_id");
  pgm.dropColumn("bills", "transferred");
};
