import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import userRoutes from "./routes/users";
import expenseRoutes from "./routes/expenses";
import categoryRoutes from "./routes/categories";
import peopleRoutes from "./routes/people";
import paymentMethodRoutes from "./routes/payment_methods";
import creditCardRoutes from "./routes/credit_cards";
import expenseAppRoutes from "./routes/expense_apps";
import currencyRoutes from "./routes/currencies";
import participantRoutes from "./routes/expense_participants";
import monthlyNoteRoutes from "./routes/monthly_notes";
import settlementRoutes from "./routes/settlements";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    // Capture response for logging errors if needed (optional, simplistic)
    const originalJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse && res.statusCode >= 400) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        console.log(logLine);
      }
    });

    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // CRUD Routes
  app.use("/api/users", userRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/people", peopleRoutes);
  app.use("/api/payment-methods", paymentMethodRoutes);
  app.use("/api/credit-cards", creditCardRoutes);
  app.use("/api/expense-apps", expenseAppRoutes);
  app.use("/api/currencies", currencyRoutes);
  app.use("/api/expense-participants", participantRoutes);
  app.use("/api/monthly-notes", monthlyNoteRoutes);
  app.use("/api/settlements", settlementRoutes);

  return app;
}
