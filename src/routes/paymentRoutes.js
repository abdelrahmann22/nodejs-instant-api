import { Router } from "express";
import asyncHandler from "express-async-handler";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  initiatePaymentController,
  getPaymentsByBillId,
  getPaymentsByUser,
  cancelPaymentController,
} from "../controllers/payments/paymentsController.js";

const router = Router();

router.post(
  "/initiate",
  protect,
  restrictTo("user"),
  asyncHandler(initiatePaymentController),
);
router.post(
  "/:id/cancel",
  protect,
  restrictTo("user"),
  asyncHandler(cancelPaymentController),
);
router.get(
  "/user",
  protect,
  restrictTo("user"),
  asyncHandler(getPaymentsByUser),
);
router.get("/:bill_id", protect, asyncHandler(getPaymentsByBillId));

export default router;
