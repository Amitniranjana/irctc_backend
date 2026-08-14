import { Router } from "express";

import { signup, verifyOtp, login } from "../controller/Auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

export default router;