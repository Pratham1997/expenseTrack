import { Router } from "express";
import { db } from "../db";
import { creditCards } from "../schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createCreditCardSchema = z.object({
    userId: z.number(),
    paymentMethodId: z.number(),
    cardName: z.string().min(1).max(100),
    bankName: z.string().max(100).optional(),
    last4: z.string().length(4).optional(),
    billingCycleStart: z.number().min(1).max(31).optional(),
    billingCycleEnd: z.number().min(1).max(31).optional(),
    isActive: z.boolean().default(true),
});

const updateCreditCardSchema = createCreditCardSchema.partial();

// GET /api/credit-cards
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

        const query = db.query.creditCards.findMany({
            where: userId
                ? and(eq(creditCards.userId, userId), eq(creditCards.isActive, true))
                : eq(creditCards.isActive, true),
            with: {
                paymentMethod: true,
            }
        });

        const results = await query;
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch credit cards" });
    }
});

// GET /api/credit-cards/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const card = await db.query.creditCards.findFirst({
            where: eq(creditCards.id, id),
        });

        if (!card) return res.status(404).json({ error: "Credit card not found" });
        res.json(card);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch credit card" });
    }
});

// POST /api/credit-cards
router.post("/", async (req, res) => {
    try {
        const body = createCreditCardSchema.parse(req.body);
        const [result] = await db.insert(creditCards).values({
            userId: body.userId,
            paymentMethodId: body.paymentMethodId,
            cardName: body.cardName,
            bankName: body.bankName,
            last4: body.last4,
            billingCycleStart: body.billingCycleStart,
            billingCycleEnd: body.billingCycleEnd,
            isActive: body.isActive,
        }).$returningId();

        const newCard = await db.query.creditCards.findFirst({
            where: eq(creditCards.id, result.id),
        });

        res.status(201).json(newCard);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to create credit card" });
    }
});

// PATCH /api/credit-cards/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateCreditCardSchema.parse(req.body);

        await db.update(creditCards)
            .set(body)
            .where(eq(creditCards.id, id));

        const updated = await db.query.creditCards.findFirst({
            where: eq(creditCards.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update credit card" });
    }
});

// DELETE /api/credit-cards/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.update(creditCards)
            .set({ isActive: false })
            .where(eq(creditCards.id, id));

        res.json({ message: "Credit card deactivated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete credit card" });
    }
});

export default router;
