import express, {
  type Application,
  type Request,
  type Response,
} from "express";
const app: Application = express();
const port = config.port;

import bcrypt from "bcryptjs";
import config from "./config";
import { initDB, pool } from "./db";

//as middleware
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// server connected Neondb by pg

initDB();

//method
app.get("/", (req: Request, res: Response) => {
  // res.send('Dev Pulse Server Running !')
  res.status(200).json({
    message: "Express Server",
    author: "Dev Pulse",
  });
});


//users


//POST
app.post("/api/auth/signup", async (req: Request, res: Response) => {
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



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
