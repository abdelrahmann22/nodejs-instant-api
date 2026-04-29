import * as webhookService from "../../services/webhooks/webhookService.js";

/**
 * Handle Stripe webhook — raw body parsed, signature verified
 * @param {import('express').Request} req - Express request (raw body from express.raw middleware)
 * @param {import('express').Response} res - Express response
 */
export const stripeWebhookController = async (req, res) => {
  const payload = typeof req.body === 'string' ? req.body : req.body.toString('utf8');
  const sig = req.headers["stripe-signature"];

  try {
    const result = await webhookService.handleWebhook({
      payload,
      sig,
    });
    res.json(result);
  } catch (err) {
    console.error("Webhook error:", err.message);
    console.error("Webhook full error:", err);
    res.status(400).json({ status: "error", message: err.message });
  }
};
