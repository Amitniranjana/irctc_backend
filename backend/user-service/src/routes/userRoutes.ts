import { Router } from "express";

import { signup, verifyOtp, login } from "../controller/Auth.js";
import Auth from "../middleware/auth.middleware.ts"
const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

export default router;