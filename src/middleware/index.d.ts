import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        role: "contributor" | "maintainer";
      } & JwtPayload;
    }
  }
}
