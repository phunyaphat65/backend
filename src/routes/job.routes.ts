import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// Validation Schema
// ===========================
const createJobSchema = z.object({
    categoryId: z.number().int(),
    jobName: z.string().min(1),
    description: z.string().optional(),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    availableDays: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    workDate: z.string(), // ISO date string
    requiredPeople: z.number().int().min(1),
    wage: z.number().positive(),
});

// ===========================
// GET /api/jobs (Public - List all open jobs)
// ===========================
router.get("/", async (req: Request, res: Response) => {
    try {
        const { categoryId, status, limit = "50", offset = "0" } = req.query;

        const where: any = {};

        if (categoryId) {
            where.categoryId = parseInt(categoryId as string);
        }

        if (status) {
            where.status = status;
        } else {
            where.status = "open"; // Default to open jobs
        }

        const jobs = await prisma.shopJobPost.findMany({
            where,
            include: {
                shop: {
                    select: {
                        id: true,
                        shopName: true,
                        profileImage: true,
                        address: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        const total = await prisma.shopJobPost.count({ where });

        res.json({ jobs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
    } catch (error) {
        console.error("Get jobs error:", error);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

// ===========================
// GET /api/jobs/:id (Public - Get job details)
// ===========================
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const job = await prisma.shopJobPost.findUnique({
            where: { id },
            include: {
                shop: {
                    select: {
                        id: true,
                        shopName: true,
                        description: true,
                        profileImage: true,
                        phone: true,
                        email: true,
                        address: true,
                    },
                },
                category: true,
                _count: {
                    select: {
                        applications: true,
                        matches: true,
                    },
                },
            },
        });

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        res.json({ job });
    } catch (error) {
        console.error("Get job error:", error);
        res.status(500).json({ error: "Failed to fetch job" });
    }
});

// ===========================
// POST /api/jobs (Protected - Shop Owner only)
// ===========================
router.post("/", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const data = createJobSchema.parse(req.body);

        // Get shop for this user
        const shop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop profile not found. Please create a shop profile first." });
        }

        // Create job post
        const job = await prisma.shopJobPost.create({
            data: {
                shopId: shop.id,
                categoryId: data.categoryId,
                jobName: data.jobName,
                description: data.description,
                contactPhone: data.contactPhone,
                address: data.address,
                availableDays: data.availableDays,
                latitude: data.latitude,
                longitude: data.longitude,
                workDate: new Date(data.workDate),
                requiredPeople: data.requiredPeople,
                wage: data.wage,
            },
            include: {
                category: true,
                shop: {
                    select: {
                        shopName: true,
                    },
                },
            },
        });

        res.status(201).json({ message: "Job created successfully", job });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Create job error:", error);
        res.status(500).json({ error: "Failed to create job" });
    }
});

// ===========================
// GET /api/jobs/my/posts (Protected - Shop Owner's jobs)
// ===========================
router.get("/my/posts", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        // Get shop for this user
        const shop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop profile not found" });
        }

        const jobs = await prisma.shopJobPost.findMany({
            where: { shopId: shop.id },
            include: {
                category: true,
                _count: {
                    select: {
                        applications: true,
                        matches: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ jobs });
    } catch (error) {
        console.error("Get my jobs error:", error);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

// ===========================
// PATCH /api/jobs/:id/status (Protected - Shop Owner only)
// ===========================
router.patch("/:id/status", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!["open", "closed", "completed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        // Get shop for this user
        const shop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop profile not found" });
        }

        // Check if job belongs to this shop
        const job = await prisma.shopJobPost.findFirst({
            where: { id, shopId: shop.id },
        });

        if (!job) {
            return res.status(404).json({ error: "Job not found or unauthorized" });
        }

        // Update status
        const updatedJob = await prisma.shopJobPost.update({
            where: { id },
            data: { status },
        });

        res.json({ message: "Job status updated", job: updatedJob });
    } catch (error) {
        console.error("Update job status error:", error);
        res.status(500).json({ error: "Failed to update job status" });
    }
});

export default router;
