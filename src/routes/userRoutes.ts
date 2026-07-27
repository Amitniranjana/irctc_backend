import { Signup } from "../controller/Auth.ts";
import express from 'express'

const router= express.Router();
router.post('/' ,Signup);
export default router