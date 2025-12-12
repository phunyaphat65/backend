import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword, generateToken, generateOTP, getOTPExpiry } from "../lib/auth";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// Validation Schemas
// ===========================
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    roleId: z.number().int().min(1).max(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    email: z.string().email(),
    otpCode: z.string().length(6),
    newPassword: z.string().min(6),
});

// ===========================
// POST /api/auth/register
// ===========================
router.post("/register", async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const passwordHash = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                roleId: data.roleId,
            },
            select: {
                id: true,
                email: true,
                roleId: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
        });

        res.status(201).json({
            message: "User registered successfully",
            user,
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// ===========================
// POST /api/auth/login
// ===========================
router.post("/login", async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { role: true },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ error: "Account is deactivated" });
        }

        // Verify password
        const isPasswordValid = await comparePassword(data.password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
        });

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role.name,
            },
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ===========================
// POST /api/auth/forgot-password
// ===========================
router.post("/forgot-password", async (req: Request, res: Response) => {
    try {
        const data = forgotPasswordSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            // Don't reveal if email exists
            return res.json({ message: "If email exists, OTP has been sent" });
        }

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Save OTP
        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                otpCode,
                otpExpiry,
            },
        });

        // TODO: Send OTP via email
        console.log(`OTP for ${data.email}: ${otpCode}`);

        res.json({ message: "OTP sent to email", otpCode }); // Remove otpCode in production
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

// ===========================
// POST /api/auth/reset-password
// ===========================
router.post("/reset-password", async (req: Request, res: Response) => {
    try {
        const data = resetPasswordSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid request" });
        }

        // Find valid OTP
        const passwordReset = await prisma.passwordReset.findFirst({
            where: {
                userId: user.id,
                otpCode: data.otpCode,
                isUsed: false,
                otpExpiry: { gte: new Date() },
            },
        });

        if (!passwordReset) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Hash new password
        const passwordHash = await hashPassword(data.newPassword);

        // Update password and mark OTP as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            prisma.passwordReset.update({
                where: { id: passwordReset.id },
                data: { isUsed: true },
            }),
        ]);

        res.json({ message: "Password reset successful" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

// ===========================
// GET /api/auth/me (Protected)
// ===========================
router.get("/me", authenticate, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                roleId: true,
                isActive: true,
                createdAt: true,
                role: { select: { name: true } },
                jobSeekerProfile: true,
                shop: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
});

export default router;
