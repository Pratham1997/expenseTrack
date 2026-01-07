// To run this script: npm run db:reset
import { db, poolConnection } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

async function resetDb() {
    console.log("WARNING: This script will DROP all tables and re-create them from db.sql.");
    console.log("All existing data will be LOST.");

    const answer = await askQuestion("Are you sure you want to continue? (y/N): ");
    if (answer.toLowerCase() !== "y") {
        console.log("Aborted.");
        process.exit(0);
    }

    try {
        const sqlPath = path.join(__dirname, "../Schema/db.sql");
        const sqlContent = fs.readFileSync(sqlPath, "utf-8");

        // Split statements
        const statements = sqlContent
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        console.log("Dropping existing tables...");
        // Disable foreign key checks to allow dropping tables in any order
        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

        // Get all tables
        const [rows] = await db.execute(sql`SHOW TABLES`);
        // rows is an array of objects like { "Tables_in_dbname": "tablename" }
        // We need to parse it safely.
        // The structure depends on the driver, but typically it's an array of RowDataPacket

        // Using a more robust query to generate Drop statements might be safer, 
        // but iterating cleanly is standard.

        // @ts-ignore
        for (const row of rows) {
            const tableName = Object.values(row)[0];
            if (typeof tableName === 'string') {
                await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tableName}\``));
                console.log(`Dropped table: ${tableName}`);
            }
        }

        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
        console.log("All tables dropped.");

        console.log(`Found ${statements.length} SQL statements to execute from db.sql.`);

        for (const statement of statements) {
            // console.log(`Executing: ${statement.substring(0, 50)}...`);
            await db.execute(sql.raw(statement));
        }

        console.log("Database schema updated (reset) successfully.");
    } catch (error) {
        console.error("Failed to reset database:", error);
    } finally {
        await poolConnection.end();
    }
}

resetDb();
