import { Router } from "express";
import { db } from "../db";
import { paymentMethods } from "../schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createPaymentMethodSchema = z.object({
    name: z.string().min(1).max(50),
    isSystem: z.boolean().default(false),
});

const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

// GET /api/payment-methods
router.get("/", async (req, res) => {
    try {
        const results = await db.query.paymentMethods.findMany();
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch payment methods" });
    }
});

// GET /api/payment-methods/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const method = await db.query.paymentMethods.findFirst({
            where: eq(paymentMethods.id, id),
        });

        if (!method) return res.status(404).json({ error: "Payment method not found" });
        res.json(method);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payment method" });
    }
});

// POST /api/payment-methods
router.post("/", async (req, res) => {
    try {
        const body = createPaymentMethodSchema.parse(req.body);
        const [result] = await db.insert(paymentMethods).values({
            name: body.name,
            isSystem: body.isSystem,
        }).$returningId();

        const newMethod = await db.query.paymentMethods.findFirst({
            where: eq(paymentMethods.id, result.id),
        });

        res.status(201).json(newMethod);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create payment method" });
    }
});

// PATCH /api/payment-methods/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updatePaymentMethodSchema.parse(req.body);

        await db.update(paymentMethods)
            .set(body)
            .where(eq(paymentMethods.id, id));

        const updated = await db.query.paymentMethods.findFirst({
            where: eq(paymentMethods.id, id),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update payment method" });
    }
});

// DELETE /api/payment-methods/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        // Payment methods don't have is_active or is_deleted, so hard delete
        await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

        res.json({ message: "Payment method deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete payment method" });
    }
});

export default router;
