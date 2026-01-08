import { Router } from "express";
import { db } from "../db";
import { categories } from "../schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { log } from "console";

const router = Router();

const createCategorySchema = z.object({
    userId: z.number(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    color: z.string().max(20).optional(),
    icon: z.string().max(50).optional(),
    isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial();

// GET /api/categories
router.get("/", async (req, res) => {
    try {
        // Optional: Filter by user_id if provided in query
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

        const query = db.query.categories.findMany({
            where: and(
                eq(categories.isActive, true),
                userId ? eq(categories.userId, userId) : sql`1=0` // Return nothing if no userId provided
            ),
            with: {
                user: true,
            }
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// GET /api/categories/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const category = await db.query.categories.findFirst({
            where: eq(categories.id, id),
        });

        if (!category) return res.status(404).json({ error: "Category not found" });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch category" });
    }
});

// POST /api/categories
router.post("/", async (req, res) => {
    try {
        const body = createCategorySchema.parse(req.body);
        const [result] = await db.insert(categories).values({
            userId: body.userId,
            name: body.name,
            description: body.description,
            color: body.color,
            icon: body.icon,
            isActive: body.isActive,
        }).$returningId();

        const newCategory = await db.query.categories.findFirst({
            where: eq(categories.id, result.id),
        });

        res.status(201).json(newCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.log(error);
        res.status(500).json({ error: "Failed to create category" });
    }
});

// PATCH /api/categories/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateCategorySchema.parse(req.body);

        await db.update(categories)
            .set(body)
            .where(eq(categories.id, id));

        const updated = await db.query.categories.findFirst({
            where: eq(categories.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update category" });
    }
});

// DELETE /api/categories/:id (Soft delete by setting isActive = false)
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.update(categories)
            .set({ isActive: false })
            .where(eq(categories.id, id));

        res.json({ message: "Category deactivated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete category" });
    }
});

export default router;
