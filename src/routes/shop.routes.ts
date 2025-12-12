import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// ===========================
// Validation Schema
// ===========================
const createShopSchema = z.object({
    shopName: z.string().min(1),
    description: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    profileImage: z.string().url().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

const updateShopSchema = createShopSchema.partial();

// ===========================
// GET /api/shops (Public - List all shops)
// ===========================
router.get("/", async (req: Request, res: Response) => {
    try {
        const shops = await prisma.shop.findMany({
            select: {
                id: true,
                shopName: true,
                description: true,
                profileImage: true,
                address: true,
                latitude: true,
                longitude: true,
                _count: {
                    select: {
                        jobPosts: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ shops });
    } catch (error) {
        console.error("Get shops error:", error);
        res.status(500).json({ error: "Failed to fetch shops" });
    }
});

// ===========================
// GET /api/shops/:id (Public - Get shop details)
// ===========================
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        const shop = await prisma.shop.findUnique({
            where: { id },
            include: {
                jobPosts: {
                    where: { status: "open" },
                    include: {
                        category: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
                _count: {
                    select: {
                        jobPosts: true,
                        workHistory: true,
                    },
                },
            },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop not found" });
        }

        res.json({ shop });
    } catch (error) {
        console.error("Get shop error:", error);
        res.status(500).json({ error: "Failed to fetch shop" });
    }
});

// ===========================
// GET /api/shops/my/profile (Protected - Shop Owner only)
// ===========================
router.get("/my/profile", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const shop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
            include: {
                _count: {
                    select: {
                        jobPosts: true,
                    },
                },
            },
        });

        if (!shop) {
            return res.status(404).json({ error: "Shop profile not found" });
        }

        res.json({ shop });
    } catch (error) {
        console.error("Get my shop error:", error);
        res.status(500).json({ error: "Failed to fetch shop profile" });
    }
});

// ===========================
// POST /api/shops (Protected - Shop Owner only)
// ===========================
router.post("/", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const data = createShopSchema.parse(req.body);

        // Check if shop already exists for this user
        const existingShop = await prisma.shop.findUnique({
            where: { userId: req.user!.userId },
        });

        if (existingShop) {
            return res.status(400).json({ error: "Shop profile already exists" });
        }

        // Create shop
        const shop = await prisma.shop.create({
            data: {
                userId: req.user!.userId,
                shopName: data.shopName,
                description: data.description,
                phone: data.phone,
                email: data.email,
                address: data.address,
                profileImage: data.profileImage,
                latitude: data.latitude,
                longitude: data.longitude,
            },
        });

        res.status(201).json({ message: "Shop created successfully", shop });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Create shop error:", error);
        res.status(500).json({ error: "Failed to create shop" });
    }
});

// ===========================
// PATCH /api/shops/my/profile (Protected - Shop Owner only)
// ===========================
router.patch("/my/profile", authenticate, requireRole(ROLES.SHOP_OWNER), async (req: Request, res: Response) => {
    try {
        const data = updateShopSchema.parse(req.body);

        const shop = await prisma.shop.update({
            where: { userId: req.user!.userId },
            data,
        });

        res.json({ message: "Shop updated successfully", shop });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        console.error("Update shop error:", error);
        res.status(500).json({ error: "Failed to update shop" });
    }
});

export default router;
