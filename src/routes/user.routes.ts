import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// GET /api/users/:id (Public - Get user basic info)
// ===========================
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// ===========================
// GET /api/users/me/full (Protected - Get full user profile)
// ===========================
router.get("/me/full", authenticate, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                roleId: true,
                isActive: true,
                createdAt: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                jobSeekerProfile: {
                    include: {
                        categories: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                shop: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error("Get full user error:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

export default router;
