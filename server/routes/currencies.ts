import { Router } from "express";
import { db } from "../db";
import { currencies } from "../schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Code is the PK, so we validate it closely
const createCurrencySchema = z.object({
    code: z.string().length(3).transform(val => val.toUpperCase()),
    name: z.string().max(50).optional(),
    symbol: z.string().max(10).optional(),
});

const updateCurrencySchema = createCurrencySchema.partial();

// GET /api/currencies
router.get("/", async (req, res) => {
    try {
        const results = await db.query.currencies.findMany();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch currencies" });
    }
});

// GET /api/currencies/:code
router.get("/:code", async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        if (code.length !== 3) return res.status(400).json({ error: "Invalid currency code" });

        const currency = await db.query.currencies.findFirst({
            where: eq(currencies.code, code),
        });

        if (!currency) return res.status(404).json({ error: "Currency not found" });
        res.json(currency);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch currency" });
    }
});

// POST /api/currencies
router.post("/", async (req, res) => {
    try {
        const body = createCurrencySchema.parse(req.body);
        // Insert, but since PK is code, no returningId. We just insert.
        await db.insert(currencies).values({
            code: body.code,
            name: body.name,
            symbol: body.symbol,
        });

        // Fetch result
        const newCurrency = await db.query.currencies.findFirst({
            where: eq(currencies.code, body.code),
        });

        res.status(201).json(newCurrency);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        // Check for duplicate entry error logic if needed, usually code 500 or constraint violation
        res.status(500).json({ error: "Failed to create currency" });
    }
});

// PATCH /api/currencies/:code
router.patch("/:code", async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        if (code.length !== 3) return res.status(400).json({ error: "Invalid currency code" });

        const body = updateCurrencySchema.parse(req.body);
        // Don't allow changing PK "code" easily here
        const { code: _, ...updateData } = body;

        if (Object.keys(updateData).length === 0) return res.json({ message: "No updates provided" });

        await db.update(currencies)
            .set(updateData)
            .where(eq(currencies.code, code));

        const updated = await db.query.currencies.findFirst({
            where: eq(currencies.code, code),
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update currency" });
    }
});

// DELETE /api/currencies/:code
router.delete("/:code", async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        if (code.length !== 3) return res.status(400).json({ error: "Invalid currency code" });

        await db.delete(currencies).where(eq(currencies.code, code));

        res.json({ message: "Currency deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete currency" });
    }
});

export default router;
