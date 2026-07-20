import { Router, type Request, type Response } from "express";
import { authController } from "./auth.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/users", auth(), authController.getAllUser);

export const authRoute = router;
