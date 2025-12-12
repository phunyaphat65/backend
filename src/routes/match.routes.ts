import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// GET /api/matches/my (Protected - Job Seeker's matches)
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

        const matches = await prisma.match.findMany({
            where: { seekerId: profile.id },
            include: {
                post: {
                    include: {
                        shop: {
                            select: {
                                shopName: true,
                                profileImage: true,
                            },
                        },
                        category: true,
                    },
                },
            },
            orderBy: { overallScore: "desc" },
        });

        res.json({ matches });
    } catch (error) {
        console.error("Get my matches error:", error);
        res.status(500).json({ error: "Failed to fetch matches" });
    }
});

export default router;
