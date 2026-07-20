import express, {
  type Application,
  type Request,
  type Response,
} from "express";
const app: Application = express();
// const port = config.port;

import bcrypt from "bcryptjs";
import config from "./config";
import { pool } from "./db";
import { authRoute } from "./modules/auth/auth.route";

//as middleware
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// server connected Neondb by pg
// initDB();

//method
app.get("/", (req: Request, res: Response) => {
  // res.send('Dev Pulse Server Running !')
  res.status(200).json({
    message: "Express Server",
    author: "Dev Pulse",
  });
});

app.use("/api/auth", authRoute)

//users


//POST


export default app;