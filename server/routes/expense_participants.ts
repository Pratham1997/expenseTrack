import { Router } from "express";
import { db } from "../db";
import { expenseParticipants } from "../schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createParticipantSchema = z.object({
    expenseId: z.number(),
    personId: z.number(),
    shareAmount: z.number(),
    isSettled: z.boolean().default(false),
});

const updateParticipantSchema = createParticipantSchema.partial();

// GET /api/expense-participants
router.get("/", async (req, res) => {
    try {
        const expenseId = req.query.expenseId ? parseInt(req.query.expenseId as string) : undefined;

        const query = db.query.expenseParticipants.findMany({
            where: expenseId ? eq(expenseParticipants.expenseId, expenseId) : undefined,
            with: {
                person: true,
            }
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch participants" });
    }
});

// GET /api/expense-participants/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const participant = await db.query.expenseParticipants.findFirst({
            where: eq(expenseParticipants.id, id),
        });

        if (!participant) return res.status(404).json({ error: "Participant not found" });
        res.json(participant);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch participant" });
    }
});

// POST /api/expense-participants
router.post("/", async (req, res) => {
    try {
        const body = createParticipantSchema.parse(req.body);

        // Explicit values for decimal handling if needed
        const [result] = await db.insert(expenseParticipants).values({
            expenseId: body.expenseId,
            personId: body.personId,
            shareAmount: body.shareAmount.toString(),
            isSettled: body.isSettled,
        }).$returningId();

        const newParticipant = await db.query.expenseParticipants.findFirst({
            where: eq(expenseParticipants.id, result.id),
        });

        res.status(201).json(newParticipant);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to create participant" });
    }
});

// PATCH /api/expense-participants/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateParticipantSchema.parse(req.body);

        const updateData: any = { ...body };
        if (body.shareAmount !== undefined) updateData.shareAmount = body.shareAmount.toString();

        await db.update(expenseParticipants)
            .set(updateData)
            .where(eq(expenseParticipants.id, id));

        const updated = await db.query.expenseParticipants.findFirst({
            where: eq(expenseParticipants.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update participant" });
    }
});

// DELETE /api/expense-participants/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.delete(expenseParticipants).where(eq(expenseParticipants.id, id));

        res.json({ message: "Participant removed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete participant" });
    }
});

export default router;
