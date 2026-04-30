import { Router } from "express";
import asyncHandler from "express-async-handler";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { initiatePaymentController, getPaymentsByBillId } from "../controllers/payments/paymentsController.js";

const router = Router();

router.post("/initiate", protect, restrictTo("user"), asyncHandler(initiatePaymentController));
router.get("/:bill_id", protect, restrictTo("merchant"), asyncHandler(getPaymentsByBillId));

export default router;
