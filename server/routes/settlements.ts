import { Router } from "express";
import { db } from "../db";
import { settlements } from "../schema";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createSettlementSchema = z.object({
    userId: z.number(),
    fromPersonId: z.number(),
    toPersonId: z.number(),
    amount: z.number(),
    settlementDate: z.coerce.date(),
    notes: z.string().optional(),
});

const updateSettlementSchema = createSettlementSchema.partial();

// GET /api/settlements
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

        const query = db.query.settlements.findMany({
            where: userId ? eq(settlements.userId, userId) : undefined,
            with: {
                fromPerson: true,
                toPerson: true,
            }
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch settlements" });
    }
});

// GET /api/settlements/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const settlement = await db.query.settlements.findFirst({
            where: eq(settlements.id, id),
        });

        if (!settlement) return res.status(404).json({ error: "Settlement not found" });
        res.json(settlement);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch settlement" });
    }
});

// POST /api/settlements
router.post("/", async (req, res) => {
    try {
        const body = createSettlementSchema.parse(req.body);

        // Explicit values for decimal handling
        const [result] = await db.insert(settlements).values({
            userId: body.userId,
            fromPersonId: body.fromPersonId,
            toPersonId: body.toPersonId,
            amount: body.amount.toString(),
            settlementDate: body.settlementDate,
            notes: body.notes,
        }).$returningId();

        const newSettlement = await db.query.settlements.findFirst({
            where: eq(settlements.id, result.id),
        });

        res.status(201).json(newSettlement);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to create settlement" });
    }
});

// PATCH /api/settlements/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateSettlementSchema.parse(req.body);

        const updateData: any = { ...body };
        if (body.amount !== undefined) updateData.amount = body.amount.toString();

        await db.update(settlements)
            .set(updateData)
            .where(eq(settlements.id, id));

        const updated = await db.query.settlements.findFirst({
            where: eq(settlements.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update settlement" });
    }
});

// DELETE /api/settlements/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.delete(settlements).where(eq(settlements.id, id));

        res.json({ message: "Settlement deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete settlement" });
    }
});

export default router;
