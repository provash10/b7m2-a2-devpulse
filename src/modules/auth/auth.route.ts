import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import { pool } from "../../db";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  // console.log(req.body);
  const { name, email, password,role } = req.body;

  try {
      const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
  INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING *
  `,
      [name, email, hashPassword,role]
    );
    // console.log(result);

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
});

export const authRoute = router;
