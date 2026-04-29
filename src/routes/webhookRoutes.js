import { Router } from "express";
import { stripeWebhookController } from "../controllers/webhooks/webhookController.js";

const router = Router();

router.post("/stripe", stripeWebhookController);

export default router;
