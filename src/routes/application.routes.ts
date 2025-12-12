import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// Validation Schema
// ===========================
const createApplicationSchema = z.object({
    postId: z.number().int(),
});

const updateStatusSchema = z.object({
    status: z.enum(["pending", "accepted", "rejected", "withdrawn"]),
});

// ===========================
// POST /api/applications (Protected - Job Seeker only)
// ===========================
router.post("/", authenticate, requireRole(ROLES.JOB_SEEKER), async (req: Request, res: Response) => {
    try {
        const data = createApplicationSchema.parse(req.body);

        // Get job seeker profile
        const profile = await prisma.jobSeekerProfile.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!profile) {
            return res.status(404).json({ error: "Job seeker profile not found. Please complete your profile first." });
        }

        // Check if job exists and is open
        const job = await prisma.shopJobPost.findUnique({
            where: { id: data.postId },
        });

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        if (job.status !== "open") {
            return res.status(400).json({ error: "Job is no longer accepting applications" });
        }

        // Check if already applied
        const existingApplication = await prisma.application.findUnique({
            where: {
                seekerId_postId: {
                    seekerId: profile.id,
                    postId: data.postId,
                },
            },
        });

        if (existingApplication) {
            return res.status(400).json({ error: "You have already applied to this job" });
        }

        // Create application
        const application = await prisma.application.create({
            data: {
                seekerId: profile.id,
                postId: data.postId,
            },
            include: {
                post: {
                    include: {
                        shop: {
                            select: {
                                shopName: true,
                            },
                        },
                        category: true,
                    },
                },
            },
        });

        res.status(201).json({ message: "Application submitted successfully", application });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Create application error:", error);
        res.status(500).json({ error: "Failed to submit application" });
    }
});

// ===========================
// GET /api/applications/my (Protected - Job Seeker's applications)
// ===========================
router.get("/my", authenticate, requireRole(ROLES.JOB_SEEKER), async (req: Request, res: Response) => {
    try {
        // Get job seeker profile
        const profile = await prisma.jobSeekerProfile.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!profile) {
            return res.status(404).json({ error: "Job seeker profile not found" });
        }

        const applications = await prisma.application.findMany({
            where: { seekerId: profile.id },
            include: {
                post: {
                    include: {
                        shop: {
                            select: {
                                id: true,
                                shopName: true,
                                profileImage: true,
                                address: true,
                            },
                        },
                        category: true,
                    },
                },
            },
            orderBy: { applicationDate: "desc" },
        });

        res.json({ applications });
    } catch (error) {
        console.error("Get my applications error:", error);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// ===========================
// GET /api/applications/job/:jobId (Protected - Shop Owner only)
// ===========================
router.get("/job/:jobId", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.jobId);

        // Get shop for this user
        const shop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop profile not found" });
        }

        // Verify job belongs to this shop
        const job = await prisma.shopJobPost.findFirst({
            where: { id: jobId, shopId: shop.id },
        });

        if (!job) {
            return res.status(404).json({ error: "Job not found or unauthorized" });
        }

        // Get applications for this job
        const applications = await prisma.application.findMany({
            where: { postId: jobId },
            include: {
                seeker: {
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                        categories: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            },
            orderBy: { applicationDate: "desc" },
        });

        res.json({ applications });
    } catch (error) {
        console.error("Get job applications error:", error);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

// ===========================
// PATCH /api/applications/:id/status (Protected - Shop Owner only)
// ===========================
router.patch("/:id/status", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateStatusSchema.parse(req.body);

        // Get shop for this user
        const shop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop profile not found" });
        }

        // Get application with job details
        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                post: true,
            },
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        // Verify job belongs to this shop
        if (application.post.shopId !== shop.id) {
            return res.status(403).json({ error: "Unauthorized to update this application" });
        }

        // Update application status
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status: data.status },
        });

        res.json({ message: "Application status updated", application: updatedApplication });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Update application status error:", error);
        res.status(500).json({ error: "Failed to update application status" });
    }
});

// ===========================
// DELETE /api/applications/:id (Protected - Job Seeker can withdraw)
// ===========================
router.delete("/:id", authenticate, requireRole(ROLES.JOB_SEEKER), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        // Get job seeker profile
        const profile = await prisma.jobSeekerProfile.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!profile) {
            return res.status(404).json({ error: "Job seeker profile not found" });
        }

        // Get application
        const application = await prisma.application.findFirst({
            where: { id, seekerId: profile.id },
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found or unauthorized" });
        }

        // Delete application
        await prisma.application.delete({
            where: { id },
        });

        res.json({ message: "Application withdrawn successfully" });
    } catch (error) {
        console.error("Delete application error:", error);
        res.status(500).json({ error: "Failed to withdraw application" });
    }
});

export default router;
