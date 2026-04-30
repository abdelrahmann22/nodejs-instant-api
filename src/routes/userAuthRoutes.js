import { Router } from "express";
import asyncHandler from "express-async-handler";
import { userSignup, userLogin } from "../controllers/auth/userController.js";

const router = Router();

router.post("/signup", asyncHandler(userSignup));
router.post("/login", asyncHandler(userLogin));

export default router;
