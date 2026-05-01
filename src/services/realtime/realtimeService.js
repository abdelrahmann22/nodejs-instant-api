import { getIO } from "../../config/socket.js";
import * as billRepo from "../../repositories/billRepo.js";
import * as authRepo from "../../repositories/authRepo.js";

export const emitPaymentSucceeded = async (billId, payment) => {
  const io = getIO();

  const bill = await billRepo.findBillById(billId);
  const paid_amount = await billRepo.findSucceededAmountByBillId(billId);
  const remaining = parseFloat(bill.amount) - paid_amount;

  const user = await authRepo.findUserById(payment.user_id);

  io.to(`bill:${billId}`).emit("payment:succeeded", {
    paid_amount,
    remaining,
    contributor: {
      name: user?.username || "Anonymous",
      amount: parseFloat(payment.amount),
    },
  });
};

export const emitBillPaid = (billId) => {
  const io = getIO();

  io.to(`bill:${billId}`).emit("bill:paid", {
    bill_id: billId,
    status: "paid",
  });
};
