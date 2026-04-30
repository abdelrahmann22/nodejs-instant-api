import { Router } from "express";
import asyncHandler from "express-async-handler";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  createBill,
  getBill,
  getBillsByMerchantId,
} from "../controllers/bills/billsController.js";

const router = Router();

router.post("/", protect, restrictTo("merchant"), asyncHandler(createBill));
router.get("/merchant", protect, restrictTo("merchant"), asyncHandler(getBillsByMerchantId));
router.get("/:id", asyncHandler(getBill));

export default router;
