import Stripe from "stripe";
import * as paymentRepo from "../../repositories/paymentsRepo.js";
import * as billRepo from "../../repositories/billRepo.js";
import * as authRepo from "../../repositories/authRepo.js";
import { emitPaymentSucceeded, emitBillPaid, emitPaymentCancelled } from "../realtime/realtimeService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Handle a Stripe webhook event — verifies signature, dispatches to handler
 * @param {Object} params
 * @param {string} params.payload - Raw request body string
 * @param {string} params.sig - Stripe-Signature header value
 * @returns {Promise<Object>} Result with received flag
 */
export const handleWebhook = async ({ payload, sig }) => {
  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object);
      break;
    case "account.updated":
      await handleAccountUpdated(event.data.object);
      break;
  }

  return { received: true };
};

/**
 * Process a completed checkout session — update payment, mark bill paid if fully covered, transfer to merchant
 * @param {Object} session - Stripe checkout session object
 */
const handleCheckoutCompleted = async (session) => {
  const paymentId = session.metadata?.payment_id;
  const billId = session.metadata?.bill_id;
  const paymentIntentId = session.payment_intent;

  if (!paymentId || !billId) {
    console.error("Missing metadata in checkout session", session.metadata);
    return;
  }

  const payment = await paymentRepo.updatePaymentStatus({
    id: paymentId,
    status: "succeeded",
    payment_intent_id: paymentIntentId,
  });

  if (!payment) {
    console.error(`Payment ${paymentId} not found for checkout completion`);
    return;
  }

  await emitPaymentSucceeded(billId, payment);

  const { bill, isPaid } = await billRepo.markBillPaidIfFullyCovered(billId);

  if (!bill || !isPaid) {
    return;
  }

  emitBillPaid(billId);

  const merchant = await authRepo.findMerchantByID(bill.merchant_id);
  if (!merchant || !merchant.stripe_account_id) {
    console.error(
      `No Stripe account for bill ${billId} — merchant not onboarded yet`,
    );
    return;
  }
  if (!merchant.charges_enabled || !merchant.details_submitted) {
    console.error(
      `Merchant ${merchant.id} not onboarded — transfer skipped, bill stays paid for bill ${billId}`,
    );
    return;
  }
  const billTotal = parseFloat(bill.amount);

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(billTotal * 100),
      currency: bill.currency || "gbp",
      destination: merchant.stripe_account_id,
      metadata: { bill_id: billId.toString() },
    });

    await billRepo.updateBillStatus({ id: billId, status: "completed" });
    await billRepo.updateBillTransfer({ id: billId, transferId: transfer.id });

    console.log(
      `Bill ${billId} completed — transferred ${billTotal} ${bill.currency} to ${merchant.stripe_account_id}`,
    );
  } catch (transferErr) {
    console.error(
      `Transfer failed for bill ${billId}: ${transferErr.message} — bill stays paid, money in platform account`,
    );
  }
};

/**
 * Process an expired checkout session — cancel the pending payment so it stops counting toward remaining balance
 * @param {Object} session - Stripe checkout session object
 */
const handleCheckoutExpired = async (session) => {
  const paymentId = session.metadata?.payment_id;

  if (!paymentId) {
    console.error(
      "Missing metadata in expired checkout session",
      session.metadata,
    );
    return;
  }

  const payment = await paymentRepo.findPaymentById(paymentId);

  if (!payment || payment.status !== "pending") {
    return;
  }

  await paymentRepo.updatePaymentStatus({
    id: paymentId,
    status: "cancelled",
    payment_intent_id: null,
  });

  await emitPaymentCancelled(payment.bill_id, payment);

  console.log(`Payment ${paymentId} cancelled — checkout session expired`);
};

const handleAccountUpdated = async (account) => {
  console.log(`account.updated fired for ${account.id} — charges_enabled: ${account.charges_enabled}, details_submitted: ${account.details_submitted}`);

  const merchant = await authRepo.findMerchantByStripeAccountId(account.id);
  if (!merchant) {
    console.error(`No merchant found for Stripe account ${account.id}`);
    return;
  }

  await authRepo.updateMerchantOnboarding({
    id: merchant.id,
    charges_enabled: account.charges_enabled,
    details_submitted: account.details_submitted,
  });

  console.log(`Merchant ${merchant.id} onboarding updated — charges_enabled: ${account.charges_enabled}, details_submitted: ${account.details_submitted}`);
};
