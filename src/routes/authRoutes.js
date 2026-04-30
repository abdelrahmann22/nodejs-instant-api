import { Router } from "express";
import asyncHandler from "express-async-handler";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  merchantSignup,
  merchantLogin,
  getOnboardingLink,
} from "../controllers/auth/merchantController.js";
import { userSignup, userLogin } from "../controllers/auth/userController.js";

const router = Router();

router.post("/merchant/signup", asyncHandler(merchantSignup));
router.post("/merchant/login", asyncHandler(merchantLogin));
router.post("/merchant/onboarding-link", protect, restrictTo("merchant"), asyncHandler(getOnboardingLink));
router.post("/user/signup", asyncHandler(userSignup));
router.post("/user/login", asyncHandler(userLogin));

export default router;
