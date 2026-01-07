import { Router } from "express";
import { db } from "../db";
import { expenses } from "../schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schemas
const createExpenseSchema = z.object({
    userId: z.number(),
    categoryId: z.number().optional(),
    paidByPersonId: z.number().optional(),
    paymentMethodId: z.number(),
    creditCardId: z.number().optional(),
    expenseAppId: z.number().optional(),
    amountOriginal: z.number(),
    currencyOriginal: z.string().length(3),
    exchangeRate: z.number().optional(),
    amountConverted: z.number(),
    expenseDate: z.coerce.date(), // Handle string to date conversion
    notes: z.string().optional(),
    isDeleted: z.boolean().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

// GET /api/expenses
router.get("/", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        const allExpenses = await db.query.expenses.findMany({
            limit,
            offset,
            orderBy: desc(expenses.expenseDate),
            where: eq(expenses.isDeleted, false),
            with: {
                category: true,
                paymentMethod: true,
                paidByPerson: true,
                expenseApp: true,
            }
        });
        res.json(allExpenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

// GET /api/expenses/:id
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const expense = await db.query.expenses.findFirst({
            where: eq(expenses.id, id),
            with: {
                category: true,
                paymentMethod: true,
                paidByPerson: true,
                participants: {
                    with: {
                        person: true
                    }
                }
            }
        });

        if (!expense) return res.status(404).json({ error: "Expense not found" });
        if (expense.isDeleted) return res.status(404).json({ error: "Expense deleted" }); // Or return 410 Gone

        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expense" });
    }
});

// POST /api/expenses
router.post("/", async (req, res) => {
    try {
        const body = createExpenseSchema.parse(req.body);

        // We need to convert numbers to strings for Decimal types if using driver directly, 
        // but Drizzle handles number JS types for Decimal columns usually, 
        // though sometimes it expects strings for precision.
        // Let's cast to any if needed or trust Drizzle's type coercion.
        // The schema says decimal(12,2), which in JS usually comes out as string, but input can be number.

        const [result] = await db.insert(expenses).values({
            userId: body.userId,
            categoryId: body.categoryId,
            paidByPersonId: body.paidByPersonId,
            paymentMethodId: body.paymentMethodId,
            creditCardId: body.creditCardId,
            expenseAppId: body.expenseAppId,
            amountOriginal: body.amountOriginal.toString(),
            currencyOriginal: body.currencyOriginal,
            exchangeRate: body.exchangeRate?.toString(),
            amountConverted: body.amountConverted.toString(),
            expenseDate: body.expenseDate,
            notes: body.notes,
            isDeleted: body.isDeleted,
        }).$returningId();

        const newExpense = await db.query.expenses.findFirst({
            where: eq(expenses.id, result.id),
        });

        res.status(201).json(newExpense);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to create expense" });
    }
});

// PATCH /api/expenses/:id
router.patch("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        const body = updateExpenseSchema.parse(req.body);

        const updateData: any = { ...body };
        if (body.amountOriginal !== undefined) updateData.amountOriginal = body.amountOriginal.toString();
        if (body.amountConverted !== undefined) updateData.amountConverted = body.amountConverted.toString();
        if (body.exchangeRate !== undefined) updateData.exchangeRate = body.exchangeRate.toString();

        await db.update(expenses)
            .set(updateData)
            .where(eq(expenses.id, id));

        const updatedExpense = await db.query.expenses.findFirst({
            where: eq(expenses.id, id),
        });

        res.json(updatedExpense);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update expense" });
    }
});

// DELETE /api/expenses/:id (Soft Delete)
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

        await db.update(expenses)
            .set({ isDeleted: true })
            .where(eq(expenses.id, id));

        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete expense" });
    }
});

export default router;
