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
import fs from "fs";

//as middleware
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log('Method - URL -Time:',req.method, req.url, Date.now());
  const log = `\nMethod -> ${req.method} - Time-> ${Date.now()} - URL ->${req.url}\n`;
  fs.appendFile("logger.txt", log,(err)=>{
    console.log(err);
  })

  next();
});

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