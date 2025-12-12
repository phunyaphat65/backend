import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// Validation Schema
// ===========================
const createProfileSchema = z.object({
    fullName: z.string().optional(),
    profileImage: z.string().url().optional(),
    age: z.number().int().min(15).max(100).optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    availableDays: z.string().optional(),
    skills: z.string().optional(),
    experience: z.string().optional(),
    categoryIds: z.array(z.number().int()).optional(),
});

const updateProfileSchema = createProfileSchema.partial();

// ===========================
// GET /api/job-seekers/my/profile (Protected - Job Seeker only)
// ===========================
router.get("/my/profile", authenticate, requireRole(ROLES.JOB_SEEKER), async (req: Request, res: Response) => {
    try {
        const profile = await prisma.jobSeekerProfile.findUnique({
            where: { userId: req.user!.userId },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
                _count: {
                    select: {
                        applications: true,
                        matches: true,
                        workHistory: true,
                    },
                },
            },
        });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.json({ profile });
    } catch (error) {
        console.error("Get my profile error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// ===========================
// POST /api/job-seekers (Protected - Job Seeker only)
// ===========================
router.post("/", authenticate, requireRole(ROLES.JOB_SEEKER), async (req: Request, res: Response) => {
    try {
        const { categoryIds, ...data } = createProfileSchema.parse(req.body);

        // Check if profile already exists
        const existingProfile = await prisma.jobSeekerProfile.findUnique({
            where: { userId: req.user!.userId },
        });

        if (existingProfile) {
            return res.status(400).json({ error: "Profile already exists" });
        }

        // Create profile with categories
        const profile = await prisma.jobSeekerProfile.create({
            data: {
                userId: req.user!.userId,
                ...data,
                ...(categoryIds && {
                    categories: {
                        create: categoryIds.map((categoryId) => ({
                            categoryId,
                        })),
                    },
                }),
            },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        res.status(201).json({ message: "Profile created successfully", profile });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Create profile error:", error);
        res.status(500).json({ error: "Failed to create profile" });
    }
});

// ===========================
// PATCH /api/job-seekers/my/profile (Protected - Job Seeker only)
// ===========================
router.patch("/my/profile", authenticate, requireRole(ROLES.JOB_SEEKER), async (req: Request, res: Response) => {
    try {
        const { categoryIds, ...data } = updateProfileSchema.parse(req.body);

        // Get current profile
        const currentProfile = await prisma.jobSeekerProfile.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!currentProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        // Update profile
        const profile = await prisma.jobSeekerProfile.update({
            where: { userId: req.user!.userId },
            data: {
                ...data,
                ...(categoryIds && {
                    categories: {
                        deleteMany: {},
                        create: categoryIds.map((categoryId) => ({
                            categoryId,
                        })),
                    },
                }),
            },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        res.json({ message: "Profile updated successfully", profile });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

export default router;
