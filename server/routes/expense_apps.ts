import { Router } from "express";
import { db } from "../db";
import { expenseApps } from "../schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createExpenseAppSchema = z.object({
    userId: z.number(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

const updateExpenseAppSchema = createExpenseAppSchema.partial();

// GET /api/expense-apps
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

        const query = db.query.expenseApps.findMany({
            where: and(
                eq(expenseApps.isActive, true),
                userId ? eq(expenseApps.userId, userId) : sql`1=0`
            ),
            with: {
                user: true,
            }
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expense apps" });
    }
});

// GET /api/expense-apps/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const app = await db.query.expenseApps.findFirst({
            where: eq(expenseApps.id, id),
        });

        if (!app) return res.status(404).json({ error: "Expense app not found" });
        res.json(app);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expense app" });
    }
});

// POST /api/expense-apps
router.post("/", async (req, res) => {
    try {
        const body = createExpenseAppSchema.parse(req.body);
        const [result] = await db.insert(expenseApps).values({
            userId: body.userId,
            name: body.name,
            description: body.description,
            isActive: body.isActive,
        }).$returningId();

        const newApp = await db.query.expenseApps.findFirst({
            where: eq(expenseApps.id, result.id),
        });

        res.status(201).json(newApp);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create expense app" });
    }
});

// PATCH /api/expense-apps/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateExpenseAppSchema.parse(req.body);

        await db.update(expenseApps)
            .set(body)
            .where(eq(expenseApps.id, id));

        const updated = await db.query.expenseApps.findFirst({
            where: eq(expenseApps.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update expense app" });
    }
});

// DELETE /api/expense-apps/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.update(expenseApps)
            .set({ isActive: false })
            .where(eq(expenseApps.id, id));

        res.json({ message: "Expense app deactivated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete expense app" });
    }
});

export default router;
