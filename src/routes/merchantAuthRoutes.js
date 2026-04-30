import { Router } from "express";
import asyncHandler from "express-async-handler";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  merchantSignup,
  merchantLogin,
  getOnboardingLink,
} from "../controllers/auth/merchantController.js";

const router = Router();

router.post("/signup", asyncHandler(merchantSignup));
router.post("/login", asyncHandler(merchantLogin));
router.post("/onboarding-link", protect, restrictTo("merchant"), asyncHandler(getOnboardingLink));

export default router;
