import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import { pool } from "../../db";
import { authController } from "./auth.controller";

const router = Router();

router.post("/signup", authController.registerUser);
router.post("/login",authController.loginUser);

export const authRoute = router;
