import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL || "mysql://expenseTrackDB_threadlow:b3dd0393ca3426ada4692c96a32c28c48c4637cc@nijkyl.h.filess.io:3307/expenseTrackDB_threadlow";

if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined in the environment variables");
}

// Prevent multiple connection pools in development due to HMR
const globalForDb = global as unknown as { dbPool: mysql.Pool };

export const poolConnection =
    globalForDb.dbPool ||
    mysql.createPool({
        uri: dbUrl,
        connectionLimit: 2, // Stay within 5 connection limit of filess.io
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });

if (process.env.NODE_ENV !== "production") {
    globalForDb.dbPool = poolConnection;
}

export const db = drizzle(poolConnection, { schema, mode: "default" });
