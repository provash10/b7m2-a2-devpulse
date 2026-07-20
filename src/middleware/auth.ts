import type { NextFunction, Request, Response } from "express";

import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let jwt_token = req.headers.authorization;

      if (!jwt_token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access !!!",
        });
      }

      if (jwt_token.startsWith("Bearer ")) {
        jwt_token = jwt_token.split(" ")[1];
      }

      const decoded = jwt.verify(
        jwt_token as string,
        config.secret as string
      ) as JwtPayload;

      const userData = await pool.query(
        `
            SELECT * FROM users WHERE email=$1
            `,
        [decoded.email]
      );

      const user = userData.rows[0];

      if (userData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found in database !",
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!!; This role have no access !",
        });
      }

      if (user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: "Forbidden ! Account is inactive.",
        });
      }

      (req as any).user = decoded;

      next();
    } catch (error: any) {
      console.log("Auth Error:", error?.message || error);
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access !! Invalid token.",
        error: error?.message,
      });
    }
  };
};

export default auth;
