import { Router } from "express";
import asyncHandler from "express-async-handler";
import { createBill, getBill } from "../controllers/bills/billsController.js";

const router = Router();

router.post("/", asyncHandler(createBill));
router.get("/:id", asyncHandler(getBill));

export default router;
