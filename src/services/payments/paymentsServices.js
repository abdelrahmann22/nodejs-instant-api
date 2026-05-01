import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import AppError from "../../utils/appError.js";
import * as billRepo from "../../repositories/billRepo.js";
import * as paymentRepo from "../../repositories/paymentsRepo.js";
import { emitPaymentCancelled } from "../realtime/realtimeService.js";

export const initiatePayment = async ({ bill_id, amount, token, user_id }) => {
  const bill = await billRepo.findBill({ billId: bill_id, token });
  if (!bill) {
    throw new AppError(404, `${bill_id} bill not found`);
  }
  if (bill.status !== "open") {
    throw new AppError(400, `Bill is ${bill.status}`);
  }

  if (new Date(bill.expires_at) < new Date()) {
    throw new AppError(400, "Bill has expired");
  }

  const paid_amount = await billRepo.findPaidAmountByBillId(bill_id);
  const remaining = parseFloat(bill.amount) - paid_amount;

  if (amount <= 0) {
    throw new AppError(400, "Amount must be positive");
  }

  if (remaining <= 0) {
    throw new AppError(
      400,
      "Bill is already fully covered by pending or completed payments",
    );
  }

  if (amount > remaining) {
    throw new AppError(400, `Amount exceeds remaining balance of ${remaining}`);
  }

  const payment = await paymentRepo.insertPayment({
    bill_id,
    user_id,
    amount,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    line_items: [
      {
        price_data: {
          currency: bill.currency || "gbp",
          product_data: { name: `Bill #${bill.id} - Split Payment` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      payment_id: payment.id.toString(),
      bill_id: bill.id.toString(),
    },
    success_url: `${process.env.FRONTEND_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&bill_id=${bill.id}`,
    cancel_url: `${process.env.FRONTEND_APP_URL}/payment/cancel?bill_id=${bill.id}`,
  });

  return { checkout_url: session.url, payment_id: payment.id };
};

export const cancelPayment = async ({ paymentId, userId }) => {
  const payment = await paymentRepo.findPaymentById(paymentId);

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.user_id !== userId) {
    throw new AppError(403, "You can only cancel your own payments");
  }

  if (payment.status !== "pending") {
    throw new AppError(400, `Payment is ${payment.status}, cannot cancel`);
  }

  const cancelled = await paymentRepo.cancelPaymentIfPending(paymentId);

  if (!cancelled) {
    throw new AppError(400, "Payment could not be cancelled");
  }

  await emitPaymentCancelled(cancelled.bill_id, cancelled);

  return cancelled;
};
