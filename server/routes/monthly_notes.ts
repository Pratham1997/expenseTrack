import { Router } from "express";
import { db } from "../db";
import { monthlyNotes } from "../schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createNoteSchema = z.object({
    userId: z.number(),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    notes: z.string().optional(),
});

const updateNoteSchema = createNoteSchema.partial();

// GET /api/monthly-notes
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const month = req.query.month ? parseInt(req.query.month as string) : undefined;

        const conditions = [];
        if (userId) conditions.push(eq(monthlyNotes.userId, userId));
        if (year) conditions.push(eq(monthlyNotes.year, year));
        if (month) conditions.push(eq(monthlyNotes.month, month));

        const query = db.query.monthlyNotes.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});

// GET /api/monthly-notes/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const note = await db.query.monthlyNotes.findFirst({
            where: eq(monthlyNotes.id, id),
        });

        if (!note) return res.status(404).json({ error: "Note not found" });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch note" });
    }
});

// POST /api/monthly-notes
router.post("/", async (req, res) => {
    try {
        const body = createNoteSchema.parse(req.body);
        const [result] = await db.insert(monthlyNotes).values({
            userId: body.userId,
            year: body.year,
            month: body.month,
            notes: body.notes,
        }).$returningId();

        const newNote = await db.query.monthlyNotes.findFirst({
            where: eq(monthlyNotes.id, result.id),
        });

        res.status(201).json(newNote);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        // Handle unique constraint violation (user, year, month)
        res.status(500).json({ error: "Failed to create note (might already exist)" });
    }
});

// PATCH /api/monthly-notes/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateNoteSchema.parse(req.body);

        await db.update(monthlyNotes)
            .set(body)
            .where(eq(monthlyNotes.id, id));

        const updated = await db.query.monthlyNotes.findFirst({
            where: eq(monthlyNotes.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update note" });
    }
});

// DELETE /api/monthly-notes/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.delete(monthlyNotes).where(eq(monthlyNotes.id, id));

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete note" });
    }
});

export default router;
