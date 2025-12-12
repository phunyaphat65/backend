import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// ===========================
// GET /api/categories
// ===========================
router.get("/", async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
        });

        res.json({ categories });
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// ===========================
// GET /api/categories/:id
// ===========================
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        jobSeekerCategories: true,
                        shopJobPosts: true,
                    },
                },
            },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ category });
    } catch (error) {
        console.error("Get category error:", error);
        res.status(500).json({ error: "Failed to fetch category" });
    }
});

export default router;
