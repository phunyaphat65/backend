import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET: any = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN || "7d";

// ===========================
// Password Hashing
// ===========================
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ===========================
// JWT Token
// ===========================
export interface JwtPayload {
    userId: number;
    email: string;
    roleId: number;
}

export function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
}

// ===========================
// OTP Generator
// ===========================
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPExpiry(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes
    return expiry;
}
