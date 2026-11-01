import express, {
  type Application,
  type Request,
  type Response,
} from "express";
const app: Application = express();

import config from "./config";
import { pool } from "./db";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issues/issues.route";
import logger from "./middleware/logger";

// middleware
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Dev Pulse",
  });
});

// routes
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

export default app;
