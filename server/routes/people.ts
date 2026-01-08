import { Router } from "express";
import { db } from "../db";
import { people } from "../schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createPeopleSchema = z.object({
    userId: z.number(),
    name: z.string().min(1).max(150),
    notes: z.string().optional(),
    relationshipType: z.string().max(50).optional(),
    isActive: z.boolean().default(true),
});

const updatePeopleSchema = createPeopleSchema.partial();

// GET /api/people
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

        const query = db.query.people.findMany({
            where: and(
                eq(people.isActive, true),
                userId ? eq(people.userId, userId) : sql`1=0`
            ),
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch people" });
    }
});

// GET /api/people/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const person = await db.query.people.findFirst({
            where: eq(people.id, id),
        });

        if (!person) return res.status(404).json({ error: "Person not found" });
        res.json(person);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch person" });
    }
});

// POST /api/people
router.post("/", async (req, res) => {
    try {
        const body = createPeopleSchema.parse(req.body);
        const [result] = await db.insert(people).values({
            userId: body.userId,
            name: body.name,
            notes: body.notes,
            relationshipType: body.relationshipType,
            isActive: body.isActive,
        }).$returningId();

        const newPerson = await db.query.people.findFirst({
            where: eq(people.id, result.id),
        });

        res.status(201).json(newPerson);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create person" });
    }
});

// PATCH /api/people/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updatePeopleSchema.parse(req.body);

        await db.update(people)
            .set(body)
            .where(eq(people.id, id));

        const updated = await db.query.people.findFirst({
            where: eq(people.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update person" });
    }
});

// DELETE /api/people/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.update(people)
            .set({ isActive: false })
            .where(eq(people.id, id));

        res.json({ message: "Person deactivated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete person" });
    }
});

export default router;
