import { RequestHandler } from "express";
import { DemoResponse } from "@shared/api";

import { sql } from "drizzle-orm";
import { db } from "../db";

export const handleDemo: RequestHandler = async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    const response: DemoResponse = {
      message: "Database connection successful",
    };
    res.json(response);
  } catch (error) {
    const response: DemoResponse = {
      message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
    };
    res.status(500).json(response);
  }
};
