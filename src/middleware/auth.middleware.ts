import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/auth";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// ===========================
// Authentication Middleware
// ===========================
export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// ===========================
// Role-based Authorization
// ===========================
export function requireRole(...allowedRoleIds: number[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        if (!allowedRoleIds.includes(req.user.roleId)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }

        next();
    };
}

// Role IDs (should match database)
export const ROLES = {
    JOB_SEEKER: 1,
    SHOP_OWNER: 2,
} as const;
