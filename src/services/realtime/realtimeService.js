import { getIO } from "../../config/socket.js";
import * as billRepo from "../../repositories/billRepo.js";
import * as authRepo from "../../repositories/authRepo.js";

export const emitPaymentInitiated = async (billId, payment) => {
  const io = getIO();

  const bill = await billRepo.findBillById(billId);
  const paid_amount = await billRepo.findSucceededAmountByBillId(billId);
  const pending_amount = await billRepo.findPendingAmountByBillId(billId);
  const remaining = parseFloat(bill.amount) - paid_amount - pending_amount;

  const user = await authRepo.findUserById(payment.user_id);

  io.to(`bill:${billId}`).emit("payment:initiated", {
    pending_amount,
    remaining,
    contributor: {
      name: user?.username || "Anonymous",
      amount: parseFloat(payment.amount),
    },
  });
};

export const emitPaymentSucceeded = async (billId, payment) => {
  const io = getIO();

  const bill = await billRepo.findBillById(billId);
  const paid_amount = await billRepo.findSucceededAmountByBillId(billId);
  const pending_amount = await billRepo.findPendingAmountByBillId(billId);
  const remaining = parseFloat(bill.amount) - paid_amount - pending_amount;

  const user = await authRepo.findUserById(payment.user_id);

  io.to(`bill:${billId}`).emit("payment:succeeded", {
    paid_amount,
    pending_amount,
    remaining,
    contributor: {
      name: user?.username || "Anonymous",
      amount: parseFloat(payment.amount),
    },
  });
};

export const emitPaymentCancelled = async (billId, payment) => {
  const io = getIO();

  const bill = await billRepo.findBillById(billId);
  const paid_amount = await billRepo.findSucceededAmountByBillId(billId);
  const pending_amount = await billRepo.findPendingAmountByBillId(billId);
  const remaining = parseFloat(bill.amount) - paid_amount - pending_amount;

  io.to(`bill:${billId}`).emit("payment:cancelled", {
    payment_id: payment.id,
    paid_amount,
    pending_amount,
    remaining,
  });
};

export const emitBillPaid = (billId) => {
  const io = getIO();

  io.to(`bill:${billId}`).emit("bill:paid", {
    bill_id: billId,
    status: "paid",
  });
};
