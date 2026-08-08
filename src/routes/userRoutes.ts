import { Signup } from "../controller/Auth.ts";
import { VerifyOtp } from "../controller/VerifyOtp.ts";
import express from 'express'

const router= express.Router();
router.post('/signup' ,Signup);
router.post('/verify-otp' ,VerifyOtp);
export default router