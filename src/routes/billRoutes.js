import { Router } from "express";
import asyncHandler from "express-async-handler";
import {
  createBill,
  getBill,
  getBillsByMerchantId,
} from "../controllers/bills/billsController.js";

const router = Router();

router.post("/", asyncHandler(createBill));
router.get("/merchant", asyncHandler(getBillsByMerchantId));
router.get("/:id", asyncHandler(getBill));

export default router;
