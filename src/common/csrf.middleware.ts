/**
 * VCDS™ CSRF Guard — Double-Submit Cookie pattern
 * Protects PWA/web endpoints. JWT Bearer tokens (mobile) are CSRF-immune.
 */
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const cookieToken = req.cookies?.["csrf-token"];
    const headerToken = req.headers["x-csrf-token"] as string;
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ message: "CSRF token mismatch" });
    }
    next();
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
