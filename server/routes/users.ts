import { Router } from "express";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schemas
const createUserSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    baseCurrency: z.string().length(3).optional(),
});

// GET /api/users
router.get("/", async (req, res) => {
    try {
        const allUsers = await db.query.users.findMany();
        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// POST /api/users
router.post("/", async (req, res) => {
    try {
        const body = createUserSchema.parse(req.body);
        const [result] = await db.insert(users).values(body).$returningId();

        // Fetch the created user
        const newUser = await db.query.users.findFirst({
            where: eq(users.id, result.id),
        });

        res.status(201).json(newUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create user" });
    }
});

export default router;
