import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  admin?: { id: string; email: string; role: AdminRole };
}

export function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Admin authorization is required." });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    response.status(500).json({ error: "Admin authentication is not configured." });
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const payload = jwt.verify(token, secret);
    if (
      typeof payload === "string" ||
      !payload.sub ||
      typeof payload.email !== "string" ||
      (payload.role !== "SUPERADMIN" && payload.role !== "STAFF")
    ) {
      response.status(401).json({ error: "Invalid admin token." });
      return;
    }
    (request as AuthenticatedRequest).admin = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as AdminRole,
    };
    next();
  } catch {
    response.status(401).json({ error: "Invalid or expired admin token." });
  }
}
