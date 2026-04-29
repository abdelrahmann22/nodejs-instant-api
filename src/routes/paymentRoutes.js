import { Router } from "express";
import asyncHandler from "express-async-handler";
import { initiatePaymentController, getPaymentsByBillId } from "../controllers/payments/paymentsController.js";

const router = Router();

router.post("/initiate", asyncHandler(initiatePaymentController));
router.get("/:bill_id", asyncHandler(getPaymentsByBillId));

export default router;
