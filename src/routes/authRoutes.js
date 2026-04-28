import { Router } from "express";
import asyncHandler from "express-async-handler";
import {
  merchantSignup,
  merchantLogin,
  userSignup,
  userLogin,
} from "../controllers/auth/authController.js";

const router = Router();

router.post("/merchant/signup", asyncHandler(merchantSignup));
router.post("/merchant/login", asyncHandler(merchantLogin));
router.post("/user/signup", asyncHandler(userSignup));
router.post("/user/login", asyncHandler(userLogin));

export default router;
