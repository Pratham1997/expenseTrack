// To run this script: npm run db:init
import { db, poolConnection } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
    try {
        const sqlPath = path.join(__dirname, "../Schema/db.sql");
        const sqlContent = fs.readFileSync(sqlPath, "utf-8");

        // Split statements by semicolon, but be careful with empty lines
        const statements = sqlContent
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        console.log(`Found ${statements.length} SQL statements to execute.`);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            // Use sql.raw for raw strings, or just execute the string if driver supports it.
            // Drizzle execute accepts a SQL object or string in some drivers, 
            // but wrapping in sql.raw() is safer for Drizzle.
            await db.execute(sql.raw(statement));
        }

        console.log("Database initialization completed successfully.");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    } finally {
        // Close the connection pool to allow script to exit
        await poolConnection.end();
    }
}

initDb();
