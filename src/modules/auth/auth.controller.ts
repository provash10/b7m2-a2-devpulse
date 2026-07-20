import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { pool } from "../../db";
import { authService } from "./auth.service";

const registerUser = async (req: Request, res: Response) => {
  // console.log(req.body);
//   const { name, email, password,role } = req.body;

  try {
     const result =await authService.registerUserIntoDB(req.body);

    res.status(201).json({
      message: "User Created Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
}


export const authController ={
    registerUser,
}