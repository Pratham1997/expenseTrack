import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL, ensure .env is correctly loaded");
}

export default defineConfig({
    out: "./migrations",
    schema: "./server/schema.ts",
    dialect: "mysql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
